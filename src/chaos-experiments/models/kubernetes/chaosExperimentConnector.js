const util = require('util');
const fs = require('fs');
const kubernetesConfig = require('../../../config/kubernetesConfig');
const logger = require('../../../common/logger');
const requestSender = require('../../../common/requestSender');
const kubernetesUrl = kubernetesConfig.kubernetesUrl;

const TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token';
const headers = {};
let supportedChaosKinds;

if (kubernetesConfig.kubernetesToken) {
    logger.info('Using kubernetes token from env var');
    headers.Authorization = 'bearer ' + kubernetesConfig.kubernetesToken;
} else {
    try {
        logger.info('kubernetes token from env var was not provided. will use: ' + TOKEN_PATH);
        const token = fs.readFileSync(TOKEN_PATH);
        headers.Authorization = 'bearer ' + token.toString();
    } catch (error) {
        logger.warn(error, 'Failed to get kubernetes token from: ' + TOKEN_PATH);
    }
}
module.exports.scheduleFinishedResourcesCleanup = async function (interval, deletionTimeThreshold) {
    supportedChaosKinds = await getSupportedKinds();
    setInterval(async () => {
        await clearAllFinishedResources(deletionTimeThreshold);
    }, interval);
};

module.exports.runChaosExperiment = async (kubernetesExperimentConfig) => {
    const resourceKindName = kubernetesExperimentConfig.kind.toLowerCase();
    const kubernetesNamespace = kubernetesExperimentConfig.metadata.namespace;
    const url = util.format('%s/apis/chaos-mesh.org/v1alpha1/namespaces/%s/%s', kubernetesUrl, kubernetesNamespace, resourceKindName);
    const options = {
        url,
        method: 'POST',
        body: kubernetesExperimentConfig,
        headers
    };
    const response = await requestSender.send(options);
    const genericJobResponse = {
        jobName: response.metadata.name,
        id: response.metadata.uid,
        namespace: response.namespace
    };
    return genericJobResponse;
};

const getSupportedKinds = async () => {
    const url = util.format('%s/apis/apiextensions.k8s.io/v1/customresourcedefinitions', kubernetesUrl);
    const options = {
        url,
        method: 'GET',
        headers
    };
    const response = await requestSender.send(options);
    const kinds = response.filter(crd => crd.spec.group === 'chaos-mesh.org').map(crd => crd.spec.plural);
    return kinds;
};

const clearAllFinishedResources = async (deletionTimeThreshold) => {
    for (const kind of supportedChaosKinds){
        const resourcesOfKind = await getAllResourcesOfKind(kind);
        const resourcesToBeDeleted = resourcesOfKind.filter(resource => {
            const experimentTimestamp = new Date(resource.metadata.creationTimestamp).valueOf();
            const thresholdTimestamp = Date.now() - deletionTimeThreshold;
            return experimentTimestamp < thresholdTimestamp;
        });
        for (const resource of resourcesToBeDeleted){
            try {
                await deleteResourcesOfKind(kind, resource.metadata.name);
            } catch (error){
                logger.error(error, `Failed to delete resource ${resource.metadata.name} of kind ${kind} from k8s`);
            }
        }
    }
};

const getAllResourcesOfKind = async (kind) => {
    const url = util.format('%s/apis/chaos-mesh.org/v1alpha1/%s', kubernetesUrl, kind);
    const options = {
        url,
        method: 'GET',
        headers
    };
    const resources = await requestSender.send(options);
    return resources;
};

const deleteResourcesOfKind = async (kind, resourceName) => {
    const url = util.format('%s/apis/chaos-mesh.org/v1alpha1/%s/%s', kubernetesUrl, kind, resourceName);
    const options = {
        url,
        method: 'DELETE',
        headers
    };
    const resources = await requestSender.send(options);
    return resources;
};
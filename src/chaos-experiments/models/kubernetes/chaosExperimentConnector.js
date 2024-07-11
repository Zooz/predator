const util = require('util');
const fs = require('fs');
const kubernetesConfig = require('../../../config/kubernetesConfig');
const logger = require('../../../common/logger');
const requestSender = require('../../../common/requestSender');
const { CHAOS_EXPERIMENT_LABELS } = require('../../../../src/common/consts');
const kubernetesUrl = kubernetesConfig.kubernetesUrl;

const TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token';
const headers = {};
const JOB_ID_LABEL = CHAOS_EXPERIMENT_LABELS.JOB_ID;
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
    logger.info(`K8S Finished chaos experiments cleanup setup - interval of ${interval}ms was set with deletion time threshold of ${deletionTimeThreshold}ms`);
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
    const genericResponse = {
        name: response.metadata.name,
        id: response.metadata.uid,
        namespace: response.namespace
    };
    return genericResponse;
};

const getSupportedKinds = async () => {
    const url = util.format('%s/apis/apiextensions.k8s.io/v1/customresourcedefinitions', kubernetesUrl);
    const options = {
        url,
        method: 'GET',
        headers
    };
    const response = await requestSender.send(options);
    const kinds = response.items.filter(crd => crd.spec.group === 'chaos-mesh.org').map(crd => crd.spec.names.plural);
    logger.info(`Supported chaos kinds that will be cleaned: ${kinds.toString()}`);
    return kinds;
};

const clearAllFinishedResources = async (deletionTimeThreshold) => {
    supportedChaosKinds = supportedChaosKinds || await getSupportedKinds();
    for (const kind of supportedChaosKinds){
        try {
            const resourcesOfKind = await getAllResourcesOfKind(kind);
            const thresholdTimestamp = Date.now() - deletionTimeThreshold;
            const resourcesToBeDeleted = resourcesOfKind.filter(resource => {
                const experimentTimestamp = new Date(resource.metadata.creationTimestamp).valueOf();
                return experimentTimestamp < thresholdTimestamp;
            });
            for (const resource of resourcesToBeDeleted){
                try {
                    await deleteResourceOfKind(kind, resource.metadata.name, resource.metadata.namespace);
                } catch (error){
                    logger.error(error, `Failed to delete resource ${resource.metadata.name} of kind ${kind} from k8s`);
                }
            }
        } catch (error){
            logger.error(error, `Failed to get resources of kind ${kind} from k8s`);
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
    return resources.items;
};

module.exports.getAllResourcesOfKindAndJob = async (kind, namespace, jobId) => {
    const url = util.format('%s/apis/chaos-mesh.org/v1alpha1/namespaces/%s/%s?labelSelector=%s=%s', kubernetesUrl, namespace, kind.toLowerCase(), JOB_ID_LABEL, jobId);
    const options = {
        url,
        method: 'GET',
        headers
    };
    const resources = await requestSender.send(options);
    return resources.items;
};

const deleteResourceOfKind = module.exports.deleteResourceOfKind = async (kind, resourceName, namespace) => {
    const url = util.format('%s/apis/chaos-mesh.org/v1alpha1/namespaces/%s/%s/%s', kubernetesUrl, namespace, kind.toLowerCase(), resourceName);
    const options = {
        url,
        method: 'DELETE',
        headers
    };
    const resources = await requestSender.send(options);
    return resources;
};
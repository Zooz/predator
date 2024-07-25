const util = require('util');
const fs = require('fs');
const kubernetesConfig = require('../../../config/kubernetesConfig');
const logger = require('../../../common/logger');
const requestSender = require('../../../common/requestSender');
const { CHAOS_EXPERIMENT_LABELS, PREDATOR_RUNNER_PREFIX } = require('../../../../src/common/consts');
const kubernetesUrl = kubernetesConfig.kubernetesUrl;

const TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token';
const headers = {};
const { APP, JOB_ID } = CHAOS_EXPERIMENT_LABELS;
const STATUS_TO_CLEAN = 'Stop';
let supportedChaosKinds;

const init = async () => {
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
    try {
        supportedChaosKinds = await getSupportedKinds();
    } catch (e){
        logger.error('Failed to get kubernetes custom defined resources, make sure privileges are configured correctly', e);
        throw e;
    }
};

const runChaosExperiment = async (kubernetesExperimentConfig) => {
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

const clearAllFinishedResources = async () => {
    let clearedCount = 0;
    try {
        supportedChaosKinds = supportedChaosKinds || await getSupportedKinds();
        for (const kind of supportedChaosKinds){
            try {
                const resourcesOfKind = await getAllResourcesOfKind(kind);
                const resourcesToBeDeleted = resourcesOfKind.filter(resource => {
                    return resource.status.experiment.desiredPhase === STATUS_TO_CLEAN;
                });
                for (const resource of resourcesToBeDeleted){
                    try {
                        await deleteResourceOfKind(kind, resource.metadata.name, resource.metadata.namespace);
                        clearedCount++;
                    } catch (error){
                        logger.error(error, `Failed to delete resource ${resource.metadata.name} of kind ${kind} from k8s`);
                    }
                }
            } catch (error){
                logger.error(error, `Failed to get resources of kind ${kind} from k8s`);
            }
        }
    } catch (e){
        logger.error(`Failed to get supported chaos kinds: ${e}`);
    }
    return clearedCount;
};

const getAllResourcesOfKind = async (kind) => {
    const url = util.format('%s/apis/chaos-mesh.org/v1alpha1/%s?labelSelector=%s=%s', kubernetesUrl, kind, APP, PREDATOR_RUNNER_PREFIX);
    const options = {
        url,
        method: 'GET',
        headers
    };
    const resources = await requestSender.send(options);
    return resources.items;
};

const deleteAllResourcesOfKindAndJob = async (kind, namespace, jobId) => {
    const url = util.format('%s/apis/chaos-mesh.org/v1alpha1/namespaces/%s/%s?labelSelector=%s=%s', kubernetesUrl, namespace, kind.toLowerCase(), JOB_ID, jobId);
    const options = {
        url,
        method: 'DELETE',
        headers
    };
    const resources = await requestSender.send(options);
    return resources;
};

const deleteResourceOfKind = async (kind, resourceName, namespace) => {
    const url = util.format('%s/apis/chaos-mesh.org/v1alpha1/namespaces/%s/%s/%s', kubernetesUrl, namespace, kind.toLowerCase(), resourceName);
    const options = {
        url,
        method: 'DELETE',
        headers
    };
    const resources = await requestSender.send(options);
    return resources;
};

module.exports = {
    runChaosExperiment,
    clearAllFinishedResources,
    deleteAllResourcesOfKindAndJob,
    deleteResourceOfKind,
    init
};

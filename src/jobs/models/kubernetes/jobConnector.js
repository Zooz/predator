'use strict';

let util = require('util');
let requestSender = require('../../../common/requestSender');

let kubernetesConfig = require('../../../config/kubernetesConfig');

let kubernetesUrl = kubernetesConfig.kubernetesUrl;
let kubernetesNamespace = kubernetesConfig.kubernetesNamespace;

let headers = {};
if (kubernetesConfig.kubernetesToken) {
    headers.Authorization = 'bearer ' + kubernetesConfig.kubernetesToken;
}

module.exports.runJob = async (kubernetesJobConfig) => {
    let url = util.format('%s/apis/batch/v1/namespaces/%s/jobs', kubernetesUrl, kubernetesNamespace);
    let options = {
        url,
        method: 'POST',
        body: kubernetesJobConfig,
        headers
    };
    let jobResponse = await requestSender.send(options);
    let genericJobResponse = {
        jobName: jobResponse.metadata.name,
        id: jobResponse.metadata.uid,
        namespace: jobResponse.namespace
    };
    return genericJobResponse;
};
module.exports.stopRun = async (jobPlatformName, platformSpecificInternalRunId) => {
    let url = util.format('%s/apis/batch/v1/namespaces/%s/jobs/%s', kubernetesUrl, kubernetesNamespace, jobPlatformName + '-' + platformSpecificInternalRunId);

    let options = {
        url,
        method: 'DELETE',
        headers
    };

    await requestSender.send(options);
};

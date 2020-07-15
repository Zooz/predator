'use strict';
let URL = require('url').URL;
let fs = require('fs');
let Docker = require('dockerode');
let dockerConfig = require('../../../config/dockerConfig');
let dockerConnection;
if (dockerConfig.host) {
    const dockerUrl = new URL(dockerConfig.host);
    dockerConnection = {
        host: dockerUrl.hostname,
        port: dockerUrl.port,
        ca: dockerConfig.certPath ? fs.readFileSync(dockerConfig.certPath + '/ca.pem') : undefined,
        cert: dockerConfig.certPath ? fs.readFileSync(dockerConfig.certPath + '/cert.pem') : undefined,
        key: dockerConfig.certPath ? fs.readFileSync(dockerConfig.certPath + '/key.pem') : undefined
    };
} else {
    dockerConnection = ({ socketPath: '/var/run/docker.sock' });
}
let docker = new Docker(dockerConnection);

const pullImage = async (dockerImage) => {
    let dockerImageStream = await docker.pull(dockerImage);
    return new Promise((resolve, reject) => {
        docker.modem.followProgress(dockerImageStream, (err) => {
            if (!err) {
                return resolve();
            } else {
                return reject(err);
            }
        });
    });
};

module.exports.runJob = async (dockerJobConfig) => {
    await pullImage(dockerJobConfig.dockerImage);

    let envVarArray = Object.keys(dockerJobConfig.environmentVariables).map((envVar) => {
        return `${envVar}=${dockerJobConfig.environmentVariables[envVar]}`;
    });

    let promises = [];
    for (let i = 0; i < (dockerJobConfig.parallelism || 1); i++) {
        promises.push(startContainer(dockerJobConfig.dockerImage, dockerJobConfig.jobName, dockerJobConfig.runId, i, envVarArray));
    }

    await Promise.all(promises);

    let genericJobResponse = {
        jobName: dockerJobConfig.jobName,
        id: dockerJobConfig.runId
    };
    return genericJobResponse;
};

const startContainer = async (dockerImage, jobName, runId, parallelIndex, envVarArray) => {
    let container;
    container = await docker.createContainer({
        name: `${jobName}-${runId}-${parallelIndex}`,
        Image: dockerImage,
        Env: envVarArray
    });

    await container.start();
};

module.exports.stopRun = async (jobPlatformName, platformSpecificInternalRunId) => {
    let containers = await docker.listContainers();

    containers = containers.filter(container => container.Names &&
        container.Names[0] && container.Names[0].includes(jobPlatformName) &&
        container.Names[0].includes(platformSpecificInternalRunId));

    containers.forEach(async container => {
        let containerToStop = await docker.getContainer(container.Id);
        await containerToStop.stop();
    }
    );
};

module.exports.deleteAllContainers = async (jobPlatformName) => {
    let containers = await docker.listContainers({ all: true, filters: JSON.stringify({ name: [jobPlatformName], status: ['exited', 'dead'] }) });
    containers.forEach(async container => {
        let containerToRemove = await docker.getContainer(container.Id);
        await containerToRemove.remove();
    });

    return {
        deleted: containers.length
    };
};

module.exports.getLogs = async (jobPlatformName, platformSpecificInternalRunId) => {
    let containers = await docker.listContainers({ all: true });

    containers = containers.filter(container => container.Names &&
        container.Names[0] && container.Names[0].includes(jobPlatformName) &&
        container.Names[0].includes(platformSpecificInternalRunId));

    let logs = [];

    for (let i = 0; i < containers.length; i++) {
        let containerToGetLogsFrom = await docker.getContainer(containers[i].Id);
        let logBuffer = await containerToGetLogsFrom.logs({ stdout: true, stderr: true });
        let logString = logBuffer.toString('utf-8');
        logs.push({ type: 'file', name: containers[i].Id + '.txt', content: logString });
    }
    return logs;
};

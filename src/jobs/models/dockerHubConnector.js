const requestSender = require('../../common/requestSender'),
    configHandler = require('../../configManager/models/configHandler'),
    configConstants = require('../../common/consts').CONFIG,
    LATEST = 'latest';

module.exports.getMostRecentRunnerTag = async () => {
    let dockerImageToUse = await configHandler.getConfigValue(configConstants.RUNNER_DOCKER_IMAGE);
    if (!dockerImageToUse.includes(':')) {
        let dockerHubInfo = await requestSender.send({
            method: 'GET',
            url: `https://hub.docker.com/v2/repositories/${dockerImageToUse}/tags`,
            json: true
        });
        let newestVersion = dockerHubInfo.results.map(version => version.name)
            .filter(version => version !== LATEST)
            .sort(sortByTags)
            .pop();

        if (!newestVersion && !dockerHubInfo.results.find((version) => version.name === LATEST)) {
            throw new Error(`No docker found for ${dockerImageToUse}`);
        } else if (!newestVersion) {
            newestVersion = LATEST;
        }

        dockerImageToUse = `${dockerImageToUse}:${newestVersion}`;
    }

    return dockerImageToUse;
};

function sortByTags(a, b) {
    let i, diff;
    let regExStrip0 = /(\.0+)+$/;
    let segmentsA = a.replace(regExStrip0, '').split('.');
    let segmentsB = b.replace(regExStrip0, '').split('.');
    let l = Math.min(segmentsA.length, segmentsB.length);

    for (i = 0; i < l; i++) {
        diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
        if (diff) {
            return diff;
        }
    }
    return segmentsA.length - segmentsB.length;
}

const requestSender = require('../../common/requestSender'),
    configHandler = require('../../configManager/models/configHandler'),
    LATEST = 'latest';

module.exports.getMostRecentRunnerTag = async () => {
    const configData = await configHandler.getConfig();
    let dockerImageToUse = configData.docker_name;
    if (!configData.docker_name.includes(':')) {
        let dockerHubInfo = await requestSender.send({
            method: 'GET',
            url: `https://hub.docker.com/v2/repositories/${configData.docker_name}/tags`,
            json: true
        });
        let newestVersion = dockerHubInfo.results.map(version => version.name)
            .filter(version => version !== LATEST)
            .sort(sortByTags)
            .pop();

        if (!newestVersion && !dockerHubInfo.results.find((version) => version.name === LATEST)) {
            throw new Error(`No docker found for ${configData.docker_name}`);
        } else if (!newestVersion) {
            newestVersion = LATEST;
        }

        dockerImageToUse = `${configData.docker_name}:${newestVersion}`;
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

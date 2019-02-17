let requestSender = require('../../common/requestSender');
let config = require('../../config/serviceConfig');

module.exports.getMostRecentRunnerTag = async () => {
    let dockerImageToUse = config.dockerName;
    if (!config.dockerName.includes(':')) {
        let dockerHubInfo = await requestSender.send({
            method: 'GET',
            url: `https://hub.docker.com/v2/repositories/${config.dockerName}/tags`,
            json: true
        });
        let newestVersion = dockerHubInfo.results.map(version => version.name)
            .filter(version => version !== 'latest')
            .sort(sortByTags)
            .pop();

        if (!newestVersion) {
            throw new Error(`No docker found for ${config.dockerName}`);
        }
        dockerImageToUse = `${config.dockerName}:${newestVersion}`;
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

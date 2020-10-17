const semver = require('semver');

const { version: PREDATOR_VERSION } = require('../../package.json');

module.exports.isBestRunnerVersionToUse = function(runnerImage) {
    const imageTag = runnerImage.split(':')[1];
    if (imageTag.toLowerCase() === 'latest') {
        return false;
    }
    if (semver.major(imageTag) !== semver.major(PREDATOR_VERSION) || semver.minor(imageTag) !== semver.minor(PREDATOR_VERSION)) {
        return false;
    }
    return true;
};

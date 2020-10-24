const semver = require('semver');

const { version: PREDATOR_VERSION } = require('../../package.json');

module.exports.isBestRunnerVersionToUse = function(runnerImage) {
    const imageTag = runnerImage.split(':')[1];
    if (!imageTag || imageTag.toLowerCase() === 'latest') {
        return false;
    }
    const predatorXRange = `${semver.major(PREDATOR_VERSION)}.${semver.minor(PREDATOR_VERSION)}.x`;
    const coercedVersion = semver.coerce(imageTag);
    if (!coercedVersion || !semver.satisfies(coercedVersion, predatorXRange)) {
        return false;
    }
    return true;
};

const { expect } = require('chai');

const packageJson = require('../../package.json');
const runnerValidator = require('../../src/common/validateRunnerVersion');

describe('validateRunnerVersion', function() {
    const originalPackageJsonVersion = packageJson.version;
    before('Set packageJson to a statice value', function() {
        packageJson.version = '1.5.0';
    });
    after('Reset packageJson to original value', function() {
        packageJson.version = originalPackageJsonVersion;
    });
    describe('#isBestRunnerVersionToUse', function() {
        it('Should return false for using latest tag', function() {
            const imageName = getImageNameWithTag('latest');
            expect(runnerValidator.isBestRunnerVersionToUse(imageName)).to.be.equal(false);
        });
        it('Should return false for using no tag', function () {
            const imageName = 'meow';
            expect(runnerValidator.isBestRunnerVersionToUse(imageName)).to.be.equal(false);
        });
        it('Should return false for using runner version with a lower major', function () {
            const imageName = getImageNameWithTag('0.0.1');
            expect(runnerValidator.isBestRunnerVersionToUse(imageName)).to.be.equal(false);
        });
        it('Should return false for using runner version with a lower minor but same major', function () {
            const imageName = getImageNameWithTag('1.0.0');
            expect(runnerValidator.isBestRunnerVersionToUse(imageName)).to.be.equal(false);
        });
        it('Should return true for using runner version with same minor and major but different patch', function () {
            const imageName = getImageNameWithTag('1.6.234');
            expect(runnerValidator.isBestRunnerVersionToUse(imageName)).to.be.equal(true);
        });
        it('Should return true for using runner version with same version', function () {
            const imageName = getImageNameWithTag('1.6.0');
            expect(runnerValidator.isBestRunnerVersionToUse(imageName)).to.be.equal(true);
        });
        it('Should return true for using runner version  in X.Y format', function () {
            const imageName = getImageNameWithTag('1.6');
            expect(runnerValidator.isBestRunnerVersionToUse(imageName)).to.be.equal(true);
        });
        it('Should return false for using runner version with pure string', function () {
            const imageName = getImageNameWithTag('meow');
            expect(runnerValidator.isBestRunnerVersionToUse(imageName)).to.be.equal(false);
        });
    });
});

function getImageNameWithTag(tag) {
    return `predator-runner:${tag}`;
}

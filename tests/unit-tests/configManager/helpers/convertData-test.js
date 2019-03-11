'use strict';

const should = require('should');
let manager = require('../../../../src/configManager/helpers/convertData');

const valuesSuccess = [{ value: '2', type: 'int', result: 2 },
    { value: JSON.stringify({ test: 'json' }), type: 'json', result: { test: 'json' } },
    { value: 'test', type: undefined, result: 'test' }, { value: undefined, type: undefined, result: undefined }];
const valuesError = [{ value: 'not int', type: 'int' }, { value: 'not json', type: 'json' }];
describe('convert data  helper tests', function () {
    describe('validate convert data of all types ', function () {
        valuesSuccess.forEach(object => {
            it('convert  value success for type:' + object.type, () => {
                let result = manager.convertByType(object.value, object.type);
                should(result).eql(object.result);
            });
        });
    });

    describe('validate convert data of all types ', function () {
        const errorText = 'Value is corrupted can cause to errors.';
        valuesError.forEach(object => {
            it('convert value with error type: ' + object.type, () => {
                let result = manager.convertByType(object.value, object.type);
                should(result).eql(undefined);
            });
        });
    });
});

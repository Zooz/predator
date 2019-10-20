'use strict';
const should = require('should');

const fileManager = require('../../../../src/tests/models/fileManager');

describe('Javascript validation', function () {
    it('Should pass javascript validation', function () {
            fileManager.validateJavascriptContent(`
                {
                    let i = 10;
                    i++;
                    console.log(i);
                }
        `)
    });

    it('Should fail javascript validation with error thrown', function () {
        let error;
        try {
            fileManager.validateJavascriptContent(`                  
                {
                    return 10;
                                        
                    function xyz() {
                        console.log('xyz')
                    }
                }
        `)
        } catch(e) {
            error = e;
        }

        should(error.statusCode).eql(422);
        should(error.message).containDeep('javascript syntax validation failed with error: Illegal return statement');
    });
});

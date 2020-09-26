const path = require('path');
const fs = require('fs');
const yaml = require('yaml');
const SwaggerParser = require('@apidevtools/swagger-parser');

const pathToDocs = path.join(process.cwd(), '/docs/openapi3.yaml');
const apiSpecInYaml = yaml.parse(fs.readFileSync(pathToDocs, 'utf8'));

describe('Validate openapi', () => {
    it('make sure it is valid and following the spec', async () => {
        await SwaggerParser.validate(apiSpecInYaml);
    });
});

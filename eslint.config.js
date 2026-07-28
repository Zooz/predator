'use strict';
const neostandard = require('neostandard');

// Flat-config replacement for the old .eslintrc.json + eslint-config-standard setup.
// neostandard is standard's flat-config successor; the rules below keep this repo's
// pre-existing deviations from standard (4-space indent, semicolons, single quotes).
module.exports = [
    ...neostandard({
        ignores: ['ui/**', 'coverage/**', 'node_modules/**'],
        semi: true,
        noJsx: true,
        noStyle: false
    }),
    {
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                before: 'readonly',
                beforeEach: 'readonly',
                after: 'readonly',
                afterEach: 'readonly'
            }
        },
        rules: {
            '@stylistic/eol-last': 'off',
            '@stylistic/space-before-function-paren': 'off',
            '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            '@stylistic/semi': ['error', 'always', { omitLastInOneLineBlock: true }],
            '@stylistic/space-before-blocks': 'off',
            '@stylistic/quote-props': ['error', 'as-needed'],
            'one-var': 'off',
            camelcase: 'warn'
        }
    }
];

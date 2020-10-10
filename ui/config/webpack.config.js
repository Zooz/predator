const webpack = require('webpack');
const HtmlPlugin = require('html-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const path = require('path');
const dotenv = require('dotenv').config({
    path: path.join(__dirname, '../.env')
});

module.exports = (webpackEnv) => {
    Object.assign(process.env, webpackEnv, dotenv.parsed);
    const env = require('../src/App/common/env');
    const entries = require('./entries');
    const rules = require('./rules');

    return {
        entry: entries,
        output: {
            publicPath: env.BUCKET_PATH,
            path: path.join(__dirname, '/../dist'), // or path: path.join(__dirname, "dist/js"),
            filename: process.env.NODE_ENV === 'production' ? 'bundle.[chunkhash:8].js' : 'bundle.js'
        },
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx']
        },
        // Emit source maps so we can debug our code in the browser
        devtool: 'source-map',
        // Tell webpack to run our source code through Babel
        module: {
            rules: rules
        },
        // Since Webpack only understands JavaScript, we need to
        // add a plugin to tell it how to handle html files.
        plugins: [
            new HtmlPlugin({
                template: 'src/index.html',
                favicon: 'src/images/favicon.png',
                inject: true,
                BUCKET_PATH: env.BUCKET_PATH || '/'
            }),
            new webpack.NamedModulesPlugin(),
            new webpack.EnvironmentPlugin(['NODE_ENV', 'BUCKET_PATH', 'PREDATOR_URL', 'PREDATOR_DOCS_URL', 'VERSION']),
            new MonacoWebpackPlugin(),
        ]
    };
};

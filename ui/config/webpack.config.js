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
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        mode: isProduction ? 'production' : 'development',
        entry: entries,
        output: {
            publicPath: env.BUCKET_PATH || '/',
            path: path.join(__dirname, '/../dist'),
            filename: isProduction ? 'bundle.[chunkhash:8].js' : 'bundle.js',
            clean: true
        },
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx']
        },
        // Emit source maps so we can debug our code in the browser
        devtool: isProduction ? 'source-map' : 'eval-source-map',
        // Tell webpack to run our source code through Babel
        module: {
            rules
        },
        devServer: {
            historyApiFallback: true,
            hot: true,
            port: 8080
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
            // object form so an unset variable falls back to '' instead of failing the build
            new webpack.EnvironmentPlugin({
                NODE_ENV: 'development',
                BUCKET_PATH: '',
                PREDATOR_URL: '',
                PREDATOR_DOCS_URL: '',
                VERSION: ''
            }),
            new MonacoWebpackPlugin()
        ]
    };
};

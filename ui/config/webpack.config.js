const webpack = require('webpack');
const HtmlPlugin = require('html-webpack-plugin');
const rules = require('./rules');
const entries = require('./entries');
const ip = require('ip');
const env = require('../src/App/common/env');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  // Tell webpack to start bundling our app at app/get-apis.js
  entry: entries,
  // Output our app to the dist/ directory
  output: {
    publicPath: env.BUCKET_PATH,
    path: __dirname + '/../dist', // or path: path.join(__dirname, "dist/js"),
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
      BUCKET_PATH: env.BUCKET_PATH || '/',
    }),
    new webpack.NamedModulesPlugin(),
    new webpack.EnvironmentPlugin(['NODE_ENV', 'BUCKET_PATH', 'PREDATOR_URL', 'PREDATOR_DOCS_URL','VERSION']),
    new MonacoWebpackPlugin()
  ]
};

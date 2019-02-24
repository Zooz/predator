const entries = [
  'babel-polyfill',
  './src'
]
;

if (process.env.NODE_ENV !== 'production') {
  entries.push(...['react-hot-loader/patch',
    'webpack-dev-server/client?http://localhost:8080/',
    'webpack/hot/only-dev-server'])
}
module.exports = entries;

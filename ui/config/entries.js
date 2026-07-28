// webpack-dev-server injects its own client/hot entries, and @babel/preset-env's browser
// targets cover what babel-polyfill used to, so a single app entry is all that's left.
module.exports = ['./src'];

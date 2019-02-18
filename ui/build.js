
process.env.NODE_ENV='production';
const config = require("./config/webpack.config");

const webpack = require("webpack");


webpack(config, (err, stats) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log(stats.toString({
        chunks: false,  // Makes the build much quieter
        colors: true    // Shows colors in the console
    }));
});
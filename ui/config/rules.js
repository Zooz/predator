const rules = [
        {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        },
        {
            test: /\.(js|ts)x?$/,
            use: {
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true,
                    plugins: ['react-hot-loader/babel']
                }
            },
            exclude:
                /node_modules/
        },
        {
            test: /\.scss$/,
            use:
                [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            import: true,
                            localIdentName: '[name]__[local]___[hash:base64:5]'
                        }
                    },
                    'sass-loader?sourceMap'
                ]
        },
        {
            test: /\.(png|jp(e*)g|svg)$/,
            use:
                [{
                    loader: 'url-loader',
                    options: {
                        limit: 8000, // Convert images < 8kb to base64 strings
                        name: 'images/[hash]-[name].[ext]'
                    }
                }]
        },
        {
            test: /\.(eot|svg|ttf|woff|woff2)$/,
            loader: 'file-loader?name=public/fonts/[name].[ext]'
        },
    {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
            {
                loader: "ts-loader"
            }
        ]
    },
    // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
    {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
    }

    ]
;

module.exports = rules;

const rules = [
    {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
    },
    {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
            loader: 'babel-loader',
            options: {
                cacheDirectory: true
            }
        }
    },
    {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'ts-loader']
    },
    {
        test: /\.scss$/,
        use: [
            'style-loader',
            {
                loader: 'css-loader',
                options: {
                    modules: {
                        // css-loader 7 defaults namedExport:true, which drops the default export and
                        // camelCases local names. This codebase does `import css from './x.scss'`
                        // and looks classes up as kebab-case (css['button-width-size']), including
                        // SCSS `:export` blocks, so both defaults have to stay off.
                        namedExport: false,
                        exportLocalsConvention: 'as-is',
                        localIdentName: '[name]__[local]___[hash:base64:5]'
                    }
                }
            },
            {
                loader: 'sass-loader',
                options: {
                    sourceMap: true
                }
            }
        ]
    },
    // webpack 5 asset modules, replacing url-loader / file-loader
    {
        test: /\.(png|jp(e*)g|svg)$/,
        type: 'asset',
        parser: {
            dataUrlCondition: {
                maxSize: 8000 // inline images smaller than 8kb as base64
            }
        },
        generator: {
            filename: 'images/[hash][ext]'
        }
    },
    {
        test: /\.(eot|ttf|woff|woff2)$/,
        type: 'asset/resource',
        generator: {
            // hashed: monaco pulls codicon.ttf in through more than one module,
            // and identical bare filenames make webpack bail with an asset conflict
            filename: 'public/fonts/[name].[hash:8][ext]'
        }
    }
];

module.exports = rules;

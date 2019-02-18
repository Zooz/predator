const rules = [
  {
    test: /\.css$/,
    use: ['style-loader', 'css-loader']
  },
  {
    test: /\.js$/,
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
                      minimize: true,
                      modules: true,
                      import: 1,
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
  }
]
;

module.exports = rules;

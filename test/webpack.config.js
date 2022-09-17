const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const dist = path.resolve(__dirname, './dist');
const src = path.resolve(__dirname, '.');

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',

    target: ['web'],
    entry: path.resolve(src, 'index.js'),

    output: {
        publicPath: '/',
        path: dist,
        filename: 'bundle.js',
    },

    plugins: [new CleanWebpackPlugin()],

    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: 'pre',
                loader: 'webpack-import-glob-loader',
            },

            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader', options: { sourceMap: true, importLoaders: 1 } },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                config: path.resolve(__dirname, 'postcss.config.js'),
                            },
                        },
                    },
                ],
            },
        ],
    },
};

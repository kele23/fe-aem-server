import path from 'path';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const dist = path.resolve(__dirname, './dist');
const src = path.resolve(__dirname, '.');

export default {
    mode: 'development',
    devtool: 'inline-source-map',

    target: ['web'],
    entry: path.resolve(src, 'index.js'),

    output: {
        publicPath: '/',
        path: dist,
        filename: '[name].js',
        clean: true,
    },

    module: {
        rules: [
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
                                config: path.resolve(__dirname, 'postcss.config.cjs'),
                            },
                        },
                    },
                ],
            },
        ],
    },
};

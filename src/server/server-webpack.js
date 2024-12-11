import webpack from 'webpack';
import path from 'path';
import Server from './server.js';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

class WebpackServer extends Server {
    constructor(webpackConfig, serverConfig) {
        super(serverConfig);
        this.webpackConfig = webpackConfig;
    }

    async _addCustomMiddlewares(app) {
        let entries = {
            hot: ['webpack-hot-middleware/client?reload=true'],
        };

        if (typeof this.webpackConfig.entry === 'string') {
            entries['main'] = this.webpackConfig.entry;
        } else if (Array.isArray(this.webpackConfig.entry)) {
            for (let i = 0; i < this.webpackConfig.entry.length; i++) {
                entries[`entry-${i}`] = this.webpackConfig.entry[i];
            }
        } else {
            entries = { ...entries, ...this.webpackConfig.entry };
        }

        if (this.serverConfig.hotComponents) {
            entries['hot'].push(path.resolve(__dirname, './static/client.js'));
        }

        // set webpack entries
        this.webpackConfig.entry = entries;

        if (this.webpackConfig.plugins) this.webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
        else this.webpackConfig.plugins = [new webpack.HotModuleReplacementPlugin()];
        const compiler = webpack(this.webpackConfig);

        // middlewares
        app.use(webpackDevMiddleware(compiler, { serverSideRender: false, writeToDisk: false }));
        app.use(webpackHotMiddleware(compiler));
    }
}

export default WebpackServer;

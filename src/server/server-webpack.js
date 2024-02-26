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
        this.webpackConfig.entry = [this.webpackConfig.entry, 'webpack-hot-middleware/client?reload=true'];
        if (this.serverConfig.hotComponents) {
            this.webpackConfig.entry.push(path.resolve(__dirname, './static/client.js'));
        }
        if (this.webpackConfig.plugins) this.webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
        else this.webpackConfig.plugins = [new webpack.HotModuleReplacementPlugin()];
        const compiler = webpack(this.webpackConfig);

        // middlewares
        app.use(webpackDevMiddleware(compiler, { serverSideRender: false, writeToDisk: false }));
        app.use(webpackHotMiddleware(compiler));
    }
}

export default WebpackServer;

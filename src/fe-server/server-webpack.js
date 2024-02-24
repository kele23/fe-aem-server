const webpack = require('webpack');
const path = require('path');
const Server = require('./server');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

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
        this.webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
        const compiler = webpack(this.webpackConfig);

        // middlewares
        app.use(webpackDevMiddleware(compiler, { serverSideRender: false, writeToDisk: false }));
        app.use(webpackHotMiddleware(compiler));
    }
}

module.exports = WebpackServer;

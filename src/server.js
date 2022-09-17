/* eslint-disable indent */
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const HTLRender = require('./htl/htl-render');
const StaticRepositoryReader = require('./resources/readers/static-repository-reader');
const logger = require('./utils/logger');
const httpLoggerMiddleware = require('./middleware/http-logger-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const rfMiddleware = require('./middleware/resource-founder-middleware');
const AemRemoteRepositoryReader = require('./resources/readers/aem-remote-repository-reader');
const mtRender = require('./methods/render-get-method');
const { createProxyMiddleware } = require('http-proxy-middleware');
const Logger = require('./utils/logger');
const rrMiddleware = require('./middleware/resource-resolver-middleware');
const path = require('path');

class Server {
    constructor(webpackConfig, serverConfig) {
        this.webpackConfig = webpackConfig;
        this.serverConfig = serverConfig;

        this._injectHotConfigurations();

        if (!serverConfig.contentRepos) {
            throw 'Missing content repos, please define at least one content repo';
        }

        //make repository readers ( libs is taken from project source)
        serverConfig.contentRepos.push({
            rootPath: '/libs',
            localPath: path.resolve(__dirname, 'repository'),
            type: 'file',
        });

        //make readers object
        const crReposObj = {};

        //other paths can be loaded from configuration
        for (let cr of serverConfig.contentRepos) {
            switch (cr.type) {
                case 'file':
                case 'json':
                    crReposObj[cr.rootPath] = new StaticRepositoryReader(cr.rootPath, cr.localPath);
                    break;

                case 'remote':
                    crReposObj[cr.rootPath] = new AemRemoteRepositoryReader(cr.rootPath, cr.aemRemote, cr.options);
                    break;
            }
        }

        //create render and resource resolver
        this.repoReadersObj = crReposObj;
        this.render = new HTLRender(this.repoReadersObj, this.serverConfig.modelAlias || []);
        this.proxies = serverConfig.proxies;

        this._makeExpressServer();
    }

    start() {
        this.app.listen(3000);
        logger.info('Server started with port 3000');
    }

    _injectHotConfigurations() {
        this.webpackConfig.entry = [this.webpackConfig.entry, 'webpack-hot-middleware/client?reload=true'];
        this.webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
        this.compiler = webpack(this.webpackConfig);

        // this.compiler.hooks.done.tap('WebpackAEMServer', async (stats) => {
        //     console.log(stats);
        // });
    }

    _makeExpressServer() {
        this.app = new express();

        //logging middleware
        this.app.use(httpLoggerMiddleware);

        //proxy
        if (this.proxies) {
            for (const proxy of this.proxies) {
                const options = {
                    ...proxy,
                    logProvider: () => {
                        return Logger;
                    },
                };
                this.app.use(proxy.middlewarePath, createProxyMiddleware(options));
            }
        }

        //middlewares
        this.app.use(webpackDevMiddleware(this.compiler, { serverSideRender: false, writeToDisk: false }));
        this.app.use(webpackHotMiddleware(this.compiler));

        //resource middleware
        this.app.use(rrMiddleware(this.repoReadersObj));
        this.app.use(rfMiddleware());

        //methods
        this.app.get('*.html', mtRender(this.render));
    }
}

module.exports = Server;

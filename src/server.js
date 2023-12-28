/* eslint-disable indent */
const express = require('express');
const HTLRender = require('./htl/htl-render');
const StaticRepositoryReader = require('./resources/readers/static-repository-reader');
const logger = require('./utils/logger');
const httpLoggerMiddleware = require('./middleware/http-logger-middleware');
const rfMiddleware = require('./middleware/resource-founder-middleware');
const AemRemoteRepositoryReader = require('./resources/readers/aem-remote-repository-reader');
const mtRender = require('./methods/render-get-method');
const { createProxyMiddleware } = require('http-proxy-middleware');
const Logger = require('./utils/logger');
const rrMiddleware = require('./middleware/resource-resolver-middleware');
const path = require('path');

class Server {
    constructor(serverConfig) {
        this.serverConfig = serverConfig;
        this.clients = [];

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
                    crReposObj[cr.rootPath] = new StaticRepositoryReader(cr.rootPath, cr.localPath, cr.options);
                    break;

                case 'remote':
                    crReposObj[cr.rootPath] = new AemRemoteRepositoryReader(cr.rootPath, cr.aemRemote, cr.options);
                    break;

                case 'custom':
                    crReposObj[cr.rootPath] = cr.reader;
            }
        }

        //create render and resource resolver
        this.repoReadersObj = crReposObj;
        this.render = new HTLRender(this.repoReadersObj, {
            modelAlias: this.serverConfig.modelAlias || ['model'],
            hotComponents: serverConfig.hotComponents,
        });
        this.proxies = serverConfig.proxies;

        // handle repo readers events
        for (const value of Object.values(crReposObj)) {
            value.on('repochanged', (data) => {
                this.clients.forEach((client) => client.response.write(`data: ${JSON.stringify(data)}\n\n`));
            });
        }
    }

    async start() {
        this.app = await this._makeExpressServer();
        this.app.listen(3000);
        logger.info('Server started with port 3000');
    }

    async _makeExpressServer() {
        const app = new express();

        //logging middleware
        app.use(httpLoggerMiddleware);

        //proxy
        if (this.proxies) {
            for (const proxy of this.proxies) {
                const options = {
                    ...proxy,
                    logProvider: () => {
                        return Logger;
                    },
                };
                app.use(proxy.middlewarePath, createProxyMiddleware(options));
            }
        }

        // hot reload
        if (this.serverConfig.hotComponents) {
            app.get('/repoevents', (req, resp) => {
                this._handleRepoEvents(req, resp);
            });
            app.get('/htlHotClient.js', (req, res) => {
                res.sendFile(path.resolve(__dirname, './static/client.js'));
            });
        }

        // webpack / vite
        await this._addCustomMiddlewares(app);

        // resources ( limited to aem paths )
        app.use('*', rrMiddleware(this.repoReadersObj));
        app.use('*', rfMiddleware());
        app.get('*', mtRender(this.render));

        return app;
    }

    _addCustomMiddlewares() {}

    _handleRepoEvents(request, response) {
        const headers = {
            'Content-Type': 'text/event-stream',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache',
        };
        response.writeHead(200, headers);

        const clientId = Date.now();
        const newClient = {
            id: clientId,
            response,
        };

        this.clients.push(newClient);
        request.on('close', () => {
            this.clients = this.clients.filter((client) => client.id !== clientId);
        });
    }
}

module.exports = Server;

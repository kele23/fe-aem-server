import express from 'express';
import HTLRender from '../engine/htl/htl-render.js';
import StaticRepositoryReader from '../engine/resources/readers/static-repository-reader.js';
import httpLoggerMiddleware from './middleware/http-logger-middleware.js';
import rfMiddleware from './middleware/resource-founder-middleware.js';
import mtRender from './methods/render-get-method.js';
import { createProxyMiddleware } from 'http-proxy-middleware';
import Logger from '../utils/logger.js';
import rrMiddleware from './middleware/resource-resolver-middleware.js';
import path from 'path';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

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
        if (this.serverConfig.hotComponents) {
            for (const value of Object.values(crReposObj)) {
                value.on('repochanged', (data) => {
                    this.clients.forEach((client) => client.response.write(`data: ${JSON.stringify(data)}\n\n`));
                });
            }
        }
    }

    async buildExpress() {
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

        // webpack / vite / dist files
        await this._addCustomMiddlewares(app);

        // dist folder
        if (this.serverConfig.distFolder) {
            var options = {
                dotfiles: 'ignore',
                etag: false,
                index: false,
                maxAge: '1d',
                redirect: false,
                fallthrough: true,
            };

            app.use(
                this.serverConfig.distFolder.middlewarePath || '/',
                express.static(this.serverConfig.distFolder.path, options),
            );
        }

        // resources ( limited to aem paths )
        app.use('*', rrMiddleware(this.repoReadersObj));
        app.use('*', rfMiddleware());
        app.get('*', mtRender(this.render));

        return app;
    }

    async _addCustomMiddlewares() {}

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

export default Server;

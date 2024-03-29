import Server from './server.js';

class ViteServer extends Server {
    constructor(viteConfigPath, serverConfig) {
        super(serverConfig);
        this.viteConfigPath = viteConfigPath;
    }

    async _addCustomMiddlewares(app) {
        const { createServer } = await import('vite');
        const vite = await createServer({
            configFile: this.viteConfigPath,
            server: { middlewareMode: true },
            appType: 'custom',
        });
        app.use(vite.middlewares);
    }
}

export default ViteServer;

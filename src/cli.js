#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { exit } from 'process';
import Logger from './utils/logger.js';

/// YARGS
const argv = yargs(hideBin(process.argv)).argv;
if (!argv['server-config']) {
    Logger.error('Please provide server configuration');
}

/// CONFIGS
const serverConfigPath = path.resolve(argv['server-config']);
if (!fs.existsSync(serverConfigPath)) {
    Logger.error('Please provide a valid configuration');
    exit(1);
}
const serverConfig = (await import(serverConfigPath)).default;

// vite or webpack
let server = null;
if (argv['webpack-config']) {
    const webpackConfigPath = path.resolve(argv['webpack-config']);
    if (!fs.existsSync(webpackConfigPath)) {
        Logger.error('Please provide a valid webpack configuration');
        exit(1);
    }

    const webpackConfig = (await import(webpackConfigPath)).default;
    const WebpackServer = (await import('./server/server-webpack.js')).default;
    server = new WebpackServer(webpackConfig, serverConfig);
} else if (argv['vite-config']) {
    const viteConfigPath = path.resolve(argv['vite-config']);
    if (!fs.existsSync(viteConfigPath)) {
        Logger.error('Please provide a valid vite configuration');
        exit(1);
    }

    const ViteServer = (await import('./server/server-vite.js')).default;
    server = new ViteServer(viteConfigPath, serverConfig);
} else {
    const Server = (await import('./server/server.js')).default;
    server = new Server(serverConfig);
}

//run server
const port = process.env.PORT || serverConfig.port || 3000;
server.buildExpress().then((app) => {
    app.listen(port, () => {
        Logger.info(`Started process on port ${port}`);
    });
});

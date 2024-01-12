#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { exit } = require('process');
const Logger = require('./src/utils/logger');

/// YARGS
const argv = yargs(hideBin(process.argv)).argv;
if (!argv['server-config']) {
    console.error('Please provide server configuration');
}

/// CONFIGS
const serverConfigPath = path.resolve(argv['server-config']);
if (!fs.existsSync(serverConfigPath)) {
    console.error('Please provide a valid configuration');
    exit(1);
}
const serverConfig = require(serverConfigPath);

// vite or webpack
let server = null;
if (argv['webpack-config']) {
    const webpackConfigPath = path.resolve(argv['webpack-config']);
    if (!fs.existsSync(webpackConfigPath)) {
        console.error('Please provide a valid webpack configuration');
        exit(1);
    }

    const webpackConfig = require(webpackConfigPath);
    const WebpackServer = require('./src/server-webpack');
    server = new WebpackServer(webpackConfig, serverConfig);
} else if (argv['vite-config']) {
    const viteConfigPath = path.resolve(argv['vite-config']);
    if (!fs.existsSync(viteConfigPath)) {
        console.error('Please provide a valid vite configuration');
        exit(1);
    }

    const ViteServer = require('./src/server-vite');
    server = new ViteServer(viteConfigPath, serverConfig);
} else {
    const Server = require('./src/server');
    server = new Server(serverConfig);
}

//run
(async () => {
    try {
        await server.start();
    } catch (e) {
        Logger.error(e);
    }
})();

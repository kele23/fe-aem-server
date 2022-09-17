#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const Server = require('./src/server');
const { hideBin } = require('yargs/helpers');

/// YARGS
const argv = yargs(hideBin(process.argv)).argv;
if (!argv['webpack-config']) {
    console.error('Please provide webpack configuration');
}
if (!argv['server-config']) {
    console.error('Please provide server configuration');
}

/// CONFIGS
const webpackConfigPath = path.resolve(argv['webpack-config']);
if (!fs.existsSync(webpackConfigPath)) {
    console.error('Please provide a valid configuration');
}

const serverConfigPath = path.resolve(argv['server-config']);
if (!fs.existsSync(serverConfigPath)) {
    console.error('Please provide a valid configuration');
}

const webpackConfig = require(webpackConfigPath);
const serverConfig = require(serverConfigPath);

//run all
const server = new Server(webpackConfig, serverConfig);
server.start();

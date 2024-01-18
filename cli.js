#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { exit } = require('process');
const Logger = require('./src/utils/logger');

Logger.info('[FAS] Initializing');

/// YARGS
const argv = yargs(hideBin(process.argv)).argv;
if (!argv['server-config']) {
    Logger.error('[FAS] Please provide server configuration');
}

/// CONFIGS
const serverConfigPath = path.resolve(argv['server-config']);
if (!fs.existsSync(serverConfigPath)) {
    Logger.error('[FAS] Please provide a valid configuration');
    exit(1);
}
const serverConfig = require(serverConfigPath);
Logger.info('[FAS] Loaded configuration');

const Server = require('./src/server');
const server = new Server(serverConfig);

Logger.info('[FAS] Building server');

//run server
const port = process.env.PORT || 3000;
server.buildExpress().then((app) => {
    Logger.info('[FAS] Starting server');
    app.listen(port, () => {
        Logger.info(`[FAS] Started process on port ${port}`);
    });
});

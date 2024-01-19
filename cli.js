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
    Logger.error('Please provide server configuration');
}

/// CONFIGS
const serverConfigPath = path.resolve(argv['server-config']);
if (!fs.existsSync(serverConfigPath)) {
    Logger.error('Please provide a valid configuration');
    exit(1);
}
const serverConfig = require(serverConfigPath);

const Server = require('./src/server');
const server = new Server(serverConfig);

//run server
const port = process.env.PORT || 3000;
server.buildExpress().then((app) => {
    app.listen(port, () => {
        Logger.info(`Started process on port ${port}`);
    });
});

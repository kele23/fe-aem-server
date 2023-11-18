const path = require('path');
const src = path.resolve(__dirname, '.');

module.exports = {
    hotComponents: true,
    codeRepo: path.resolve(src, 'repository'),
    contentRepos: [
        {
            rootPath: '/',
            localPath: path.resolve(src, 'repository'),
            type: 'file',
        },
        {
            rootPath: '/content/remote',
            type: 'remote',
            aemRemote: 'http://localhost:4502/content/remote',
            options: {
                urlFn: (remote, cleanedPath, level) => {
                    return `${remote}${cleanedPath}.aktrend.${level}.json`;
                },
                request: {
                    authorization: 'YWRtaW46YWRtaW4=',
                },
            },
        },
    ],
    proxies: [
        {
            middlewarePath: '/api',
            target: 'http://localhost:4502/api',
            changeOrigin: true,
            auth: 'admin:admin',
            logLevel: 'debug',
        },
    ],
    //modelAlias: ['model'],
};

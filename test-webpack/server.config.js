import path from 'path';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const src = path.resolve(__dirname, '.');

export default {
    port: 3001,
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
    distFolder: {
        middlewarePath: '/',
        path: path.resolve(__dirname, 'dist'),
    },
    modelAlias: ['model'],
    defaultModel: '/apps/_models/@default.js',
};

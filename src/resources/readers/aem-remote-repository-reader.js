const Logger = require('../../utils/logger');
const RepoReader = require('../repo-reader');
var request = require('sync-request');

class AemRemoteRepositoryReader extends RepoReader {
    constructor(basePath, aemRemote, options) {
        super(basePath);
        this.aemRemote = aemRemote;
        this.options = options;
    }

    _innerGet(repoPath, ctx) {
        const value = this._getFromCtx(repoPath, ctx);
        if (value) return value;

        let url = null;
        let basePath = repoPath;
        if (repoPath.indexOf('jcr:content') >= 0) {
            basePath = repoPath.substring(0, repoPath.indexOf('jcr:content') + 11);
            url = this._getRemoteUrl(basePath, 'infinity');
        } else {
            url = this._getRemoteUrl(repoPath, 1);
        }

        try {
            var res = request('GET', url, this.options.request);
            var data = JSON.parse(res.getBody('utf8'));
            if (data) this._addToCtx(data, basePath, ctx);
        } catch (error) {
            Logger.warn(error);
        }

        return this._getFromCtx(repoPath, ctx);
    }

    _innerSystemPath() {
        throw 'Method not available for remote repository';
    }

    _getRemoteUrl(repoPath, level) {
        const cleanedPath = repoPath.replace(this.basePath, '');
        if (!this.options.urlFn) {
            return `${this.aemRemote}${cleanedPath}.${level}.json`;
        } else {
            return this.options.urlFn(this.aemRemote, cleanedPath, level);
        }
    }
}

module.exports = AemRemoteRepositoryReader;

class RepoReader {
    constructor(basePath) {
        this.basePath = basePath;
    }

    /**
     * Get the correct repoReader using the resourcePath
     * @param {*} resourcePath
     * @param {*} repoReadersObj
     * @returns
     */
    static getRepoReader(resourcePath, repoReadersObj) {
        let found = null;
        let keyFound = null;
        for (const key in repoReadersObj) {
            if (resourcePath.startsWith(key)) {
                //get the most length
                if (keyFound == null || keyFound.length < key.length) {
                    keyFound = key;
                    found = repoReadersObj[key];
                }
            }
        }
        return found;
    }

    /**
     * Returns an object from the repository if exists, and add it to the ctx object
     * @param {string} repoPath
     * @param {Object} ctx
     * @returns {Object} the repo object
     */
    get(repoPath, ctx) {
        return this._innerGet(repoPath, ctx);
    }

    /**
     * Get the local system path to the resource if available, or something equivalent
     * @param {string} repoPath
     * @param {Object} ctx
     * @returns The system path
     */
    getSystemPath(repoPath, ctx) {
        return this._innerSystemPath(repoPath, ctx);
    }

    /**
     * Get the object from the context
     * @param {*} repoPath The path
     * @param {*} ctx The ctx object
     * @returns An object from the ctx
     */
    _getFromCtx(repoPath, ctx) {
        //make context if not exists
        if (!ctx.contents) ctx.contents = {};
        const ctn = ctx.contents[repoPath];
        if (ctn) return ctn;
    }

    /**
     * Adds repository data to the ctx
     * @param {*} data The repository data
     * @param {*} basePath The basePath ( of where starts the data )
     * @param {*} ctx The ctx
     */
    _addToCtx(data, basePath, ctx) {
        this._explode(data, basePath, ctx.contents);
    }

    /**
     * The process that explodes a repository data to obtain a key value object with paths
     * @param {*} content
     * @param {*} contentPath
     * @param {*} ctxContent
     */
    _explode(content, contentPath, ctxContent) {
        ctxContent[contentPath] = content;
        for (const child in content) {
            if (typeof content[child] == 'object') {
                this._explode(content[child], contentPath + '/' + child, ctxContent);
            }
        }
    }

    // eslint-disable-next-line no-unused-vars
    async _innerGet(repoPath) {
        throw 'Method not implemented';
    }
}

module.exports = RepoReader;

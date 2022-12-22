const { mergeDeepToPath, deepGet } = require('../utils/utils');
const { getData } = require('../utils/request-variables-utils');

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
            if (resourcePath.startsWith(key) || resourcePath == key) {
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
    // eslint-disable-next-line no-unused-vars
    get(repoPath, ctx) {
        throw 'Please implement this method in a subclass';
    }

    /**
     * Resolve the repoPath and returns an object with finalPath and content
     * Resolve must return an object with finalPath ( founded resource ) and object
     * if no resources is found then non existing resource must be returned
     * @param {*} repoPath
     * @param {*} ctx
     * @returns
     */
    resolve(repoPath, ctx) {
        let content = this.get(repoPath, ctx);
        if (!content)
            content = {
                'sling:resourceType': 'sling:nonexisting',
            };
        return content;
    }

    /**
     * Get the local system path to the resource if available, or something equivalent
     * @param {string} repoPath
     * @param {Object} ctx
     * @returns The system path
     */
    // eslint-disable-next-line no-unused-vars
    getSystemPath(repoPath, ctx) {
        throw 'Please implement this method in a subclass';
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
        return deepGet(ctx.contents, repoPath);
    }

    /**
     * Return the current request query string
     * @param {*} ctx
     * @returns
     */
    _getQuery(ctx) {
        if (!ctx.request) return {};
        return ctx.request.query;
    }

    /**
     * Return the current request query string
     * @param {*} ctx
     * @returns
     */
    _getSuffix(ctx) {
        if (!ctx.request) return '';
        return getData(ctx.request, 'requestedSuffix');
    }

    /**
     * Return the current request query string
     * @param {*} ctx
     * @returns
     */
    _getSelectors(ctx) {
        if (!ctx.request) return [];
        const selectors = getData(ctx.request, 'requestedSelectors');
        if (!selectors) return [];
        return selectors;
    }

    /**
     * Adds repository data to the ctx
     * @param {*} data The repository data
     * @param {*} basePath The basePath ( of where starts the data )
     * @param {*} ctx The ctx
     */
    _addToCtx(data, basePath, ctx) {
        ctx.contents = mergeDeepToPath(ctx.contents, data, basePath);
    }

    // eslint-disable-next-line no-unused-vars
    async _innerGet(repoPath) {
        throw 'Method not implemented';
    }
}

module.exports = RepoReader;

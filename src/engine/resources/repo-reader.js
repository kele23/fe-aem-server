import { EventEmitter } from 'node:events';
import Logger from '../../utils/logger.js';

class RepoReader extends EventEmitter {
    constructor(basePath) {
        super();
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
     * @returns {Object} the repo object
     */
    // eslint-disable-next-line no-unused-vars
    get(repoPath) {
        throw 'Please implement this method in a subclass';
    }

    /**
     * Resolve the repoPath and returns an object with finalPath and content
     * Resolve must return an object with finalPath ( founded resource ) and object
     * if no resources is found then non existing resource must be returned
     * @param {*} repoPath
     * @returns
     */
    resolve(repoPath, resourceType) {
        let content = this.get(repoPath);

        //create content if not exists
        if (!content) {
            content = {
                'sling:resourceType': 'sling:nonexisting',
            };
        }

        //change resource type if different
        if (resourceType && content['sling:resourceType'] != resourceType) {
            content['sling:resourceType'] = resourceType;
        }

        return content;
    }

    /**
     * Get the local system path to the resource if available, or something equivalent
     * @param {string} repoPath
     * @param {Object} ctx
     * @returns The system path
     */
    // eslint-disable-next-line no-unused-vars
    getSystemPath(repoPath) {
        throw 'Please implement this method in a subclass';
    }

    /**
     * Read the resource from local system as Text
     * @param {string} repoPath
     * @param {Object} ctx
     * @returns The text content of the resource
     */
    // eslint-disable-next-line no-unused-vars
    async readText(repoPath) {
        throw 'Please implement this method in a subclass';
    }

    // eslint-disable-next-line no-unused-vars
    async _innerGet(repoPath) {
        throw 'Method not implemented';
    }

    _changed(repoPath) {
        Logger.debug('Changed path ' + repoPath);
        this.emit('repochanged', { path: repoPath });
    }
}

export default RepoReader;

const Resource = require('./resource');
const path = require('path');
const RepoReader = require('./repo-reader');

class ResourceResolver {
    constructor(repoReaders, request) {
        this.repoReaders = repoReaders;
        this.syntetic = {};
        this.ctx = {
            request,
        };
    }

    /**
     * @param {string} path
     * @returns The path of the resource
     */
    getResource(resourcePath) {
        // if syntetic then return it
        if (this.syntetic[resourcePath]) return this._makeResource(resourcePath, this.syntetic[resourcePath]);

        // check absolute path
        if (resourcePath.startsWith('/')) {
            return this._innerGetResource(resourcePath);
        }

        // check relative path to apps and libs
        const res = this._innerGetResource('/apps/' + resourcePath);
        if (res) return res;
        return this._innerGetResource('/libs/' + resourcePath);
    }

    /**
     * @param {string} path
     * @returns The path of the resource
     */
    resolve(resourcePath, resourceType) {
        // if syntetic then return it
        if (this.syntetic[resourcePath]) return this._makeResource(resourcePath, this.syntetic[resourcePath]);

        // check absolute path
        if (resourcePath.startsWith('/')) {
            return this._innerResolveResource(resourcePath, resourceType);
        }

        // check relative path to apps and libs
        const res = this._innerResolveResource('/apps/' + resourcePath, resourceType);
        if (res) return res;
        return this._innerResolveResource('/libs/' + resourcePath, resourceType);
    }

    _innerGetResource(resourcePath) {
        const reader = this._getRepoReader(resourcePath);
        if (reader == null) return null;

        //otherwise access repo
        const obj = reader.get(resourcePath, this.ctx);
        if (obj) return this._makeResource(resourcePath, obj);
        return null;
    }

    _innerResolveResource(resourcePath, resourceType) {
        const reader = this._getRepoReader(resourcePath);
        if (reader == null) return null;

        //otherwise access repo
        const content = reader.resolve(resourcePath, resourceType, this.ctx);
        return this._makeResource(resourcePath, content);
    }

    /**
     * @param {Resource} resource
     * @param {string} name
     * @returns The child of the resource with the name
     */
    getChild(resource, name) {
        const resourcePath = resource.getPath() + '/' + name;
        return this.getResource(resourcePath);
    }

    /**
     * The children of the resource
     * @param {Resource} resource
     */
    getChildren(resource) {
        const result = [];
        const resourcePath = resource.getPath();

        const reader = this._getRepoReader(resourcePath);
        if (reader == null) return null;
        const obj = reader.get(resourcePath, this.ctx);

        for (const name in obj) {
            const child = obj[name];
            if (typeof child === 'object') {
                const ch = this.getResource(resourcePath + '/' + name);
                if (ch) result.push(ch);
            }
        }
        return result;
    }

    /**
     * @param {Resource} resource
     * @returns The parent resource
     */
    getParent(resource) {
        const resourcePath = resource.getPath();
        const parentPath = path.dirname(resourcePath);
        return this.getResource(parentPath);
    }

    /**
     * The properties of the resource
     * @param {Resource} resource
     */
    getValueMap(resource) {
        // if syntetic then return it
        if (this.syntetic[resource.getPath()]) return this.syntetic[resource.getPath()];

        // check readers
        const reader = this._getRepoReader(resource.getPath());
        if (reader == null) return null;

        // get data or return empty object
        const data = reader.get(resource.getPath(), this.ctx);
        if (!data) return {};
        return data;
    }

    /**
     * The system path
     * @param {*} resourcePath
     */
    getSystemPath(resourcePath) {
        const reader = this._getRepoReader(resourcePath);
        if (reader == null) return null;
        return reader.getSystemPath(resourcePath, this.ctx);
    }

    /**
     * Make a new Syntetic resource
     * @param {Object} content
     * @param {string} resourcePath
     * @param {string} resourceType
     */
    makeSynteticResource(content, resourcePath, resourceType) {
        const obj = {
            'sling:resourceType': resourceType,
            ...content,
        };
        this.syntetic[resourcePath] = obj;
        return this._makeResource(resourcePath, obj);
    }

    /**
     * Create a new resource that overrides resource type of the provided resource
     * @param {*} resource
     * @param {*} resourceType
     * @returns
     */
    overrideResourceType(resource, resourceType) {
        return new Resource(resource.getPath(), resourceType, this);
    }

    /**
     * @param {string} resourcePath
     * @param {object} content
     * @returns Make a new resource
     */
    _makeResource(resourcePath, content) {
        return new Resource(resourcePath, this._getResourceType(content), this);
    }

    /**
     * @param {object} content
     * @returns The resource type
     */
    _getResourceType(content) {
        let resourceType = content['sling:resourceType'];
        if (!resourceType) {
            const primaryType = content['jcr:primaryType'];
            if (primaryType) resourceType = primaryType.replace(/:/g, '/').toLowerCase();
            else resourceType = 'nt/unstructured';
        }
        return resourceType;
    }

    /**
     * Get the repo reader
     * @param {*} resourcePath
     * @returns
     */
    _getRepoReader(resourcePath) {
        return RepoReader.getRepoReader(resourcePath, this.repoReaders);
    }
}

module.exports = ResourceResolver;

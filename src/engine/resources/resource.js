const path = require('path');

class Resource {
    constructor(path, resourceType, resourceResolver) {
        this._path = path;
        this._resourceResolver = resourceResolver;
        this._resourceType = resourceType;
    }

    getPath() {
        return this._path;
    }

    get path() {
        return this.getPath();
    }

    getName() {
        return path.basename(this._path);
    }

    get name() {
        return this.getName();
    }

    getResourceType() {
        return this._resourceType;
    }

    get resourceType() {
        return this.getResourceType();
    }

    getValueMap() {
        return this._resourceResolver.getValueMap(this);
    }

    getProperties() {
        return this._resourceResolver.getValueMap(this);
    }

    getResourceResolver() {
        return this._resourceResolver;
    }

    getParent() {
        return this._resourceResolver.getParent(this);
    }

    getChildren() {
        return this._resourceResolver.getChildren(this);
    }

    listChildren() {
        return this._resourceResolver.getChildren(this);
    }

    getChild(name) {
        return this._resourceResolver.getChild(this, name);
    }
}

module.exports = Resource;

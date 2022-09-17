const Model = require('./model');
const path = require('path');

class BindingsProvider {
    /**
     * Construct a bindings provider
     * @param {Object} bindings Custom bindings provided in plugin configuration
     * @param {Object} compilationOptions Compilation options
     */
    constructor(bindings, modelAlias, htlResourceResolver) {
        this.bindings = bindings;
        this.modelAlias = modelAlias;
        this.htlResourceResolver = htlResourceResolver;
    }

    /**
     * Get bindings names
     */
    get names() {
        let result = [...this.modelAlias];
        if (this.bindings) result = result.concat(Object.keys(this.bindings));
        return result;
    }

    /**
     *
     * Provide the bindings for the current resource
     * @param {string} sourceDir
     * @param {Resource} resource
     * @param {Object} currentGlobals
     * @returns {Object} The bindings
     */
    provide(resource, currentGlobals) {
        const result = {};
        const res = this.htlResourceResolver.getResource(path.join(resource.getResourceType(), '@model.js'));
        if (res) {
            const absPath = this.htlResourceResolver.getSystemPath(res.getPath());
            const model = new Model(absPath);
            const modelResult = model.use(currentGlobals);
            for (const alias of this.modelAlias) {
                result[alias] = modelResult;
            }
        }
        if (this.bindings) {
            for (const key in this.bindings) {
                if (typeof this.bindings[key] == 'function') result[key] = this.bindings[key].call(currentGlobals);
                else result[key] = this.bindings[key];
            }
        }
        return result;
    }
}

module.exports = BindingsProvider;

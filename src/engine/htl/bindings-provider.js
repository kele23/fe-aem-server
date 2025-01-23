import Model from './model.js';
import path from 'path';

class BindingsProvider {
    /**
     * Construct a bindings provider
     * @param {Object} bindings Custom bindings provided in plugin configuration
     * @param {Object} modelAlias The model name
     * @param {Object} defaultModel Path to default model ( if provided )
     * @param {Object} htlResourceResolver The resource resolver
     */
    constructor(bindings, modelAlias, defaultModel, htlResourceResolver) {
        this.bindings = bindings;
        this.modelAlias = modelAlias;
        this.defaultModel = defaultModel;
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
        const res = this._getModelResource(resource);
        if (res) {
            const absPath = this.htlResourceResolver.getSystemPath(res.getPath());
            const model = new Model(absPath);
            const modelResult = model.use(currentGlobals);
            for (const alias of this.modelAlias) {
                result[alias] = modelResult;
            }
        } else {
            const modelResult = currentGlobals.properties;
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

    _getModelResource(resource) {
        // check current resource type model
        const res = this.htlResourceResolver.getResource(path.posix.join(resource.getResourceType(), '@model.js'));
        if (res) return res;

        // check default model if provided
        if (this.defaultModel) {
            const defModel = this.htlResourceResolver.getResource(this.defaultModel);
            if (defModel) return defModel;
        }

        return null;
    }
}

export default BindingsProvider;

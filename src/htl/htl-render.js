const { Compiler, Runtime } = require('@adobe/htlengine');
const path = require('path');
const fs = require('fs');
const BindingsProvider = require('./bindings-provider');
const logger = require('../utils/logger');
const ResourceResolver = require('../resources/resource-resolver');

class HTLRender {
    /**
     *
     * @param {BindingsProvider} bindings The BindingsPro
     * @param {Object} options Compilation options
     */
    constructor(repoReaders, modelAlias) {
        this.htlResourceResolver = new ResourceResolver(repoReaders);
        this.bindings = new BindingsProvider({}, modelAlias, this.htlResourceResolver);
    }

    /**
     * Render a resource
     * @param {Resource} the resource
     * @param {Object} compilationOptions
     * @returns {string} HTML
     */
    async rendComponent(componentResource, selectors) {
        // get resource resolver
        const htlResource = this.htlResourceResolver.getResource(componentResource.getResourceType());
        if (!htlResource) {
            return null;
        }

        // get system path
        const componentPath = this.htlResourceResolver.getSystemPath(htlResource.getPath());
        const componentName = path.basename(componentPath);
        const componentHtmlFileAbs =
            selectors == null || selectors.length == 0
                ? path.join(componentPath, `${componentName}.html`)
                : path.join(componentPath, `${selectors}.html`);
        if (!fs.existsSync(componentHtmlFileAbs)) {
            return null;
        }

        // set page properties
        let pageProperties = null;
        if (componentResource.getResourceType() == 'cq/page') {
            pageProperties = componentResource.getChild('jcr:content').getValueMap();
        }

        // set global properties
        let global = {
            wcmmode: { disabled: true },
            resource: componentResource,
            resourceResolver: componentResource.getResourceResolver(),
            properties: componentResource.getValueMap(),
            pageProperties,
        };

        global = {
            ...global,
            ...this.bindings.provide(componentResource, global),
        };

        return await this._rendFile(componentHtmlFileAbs, global);
    }

    /**
     * Render an htl file
     * @param {string} componentAbsPath
     * @param {Object} global
     * @returns {string} HTML
     */
    async _rendFile(componentAbsPath, global) {
        const resourceType = global.resource.getResourceType();

        const compiler = this._getCompiler(resourceType);
        const runtime = new Runtime()
            .withResourceLoader(this._makeResourceLoader())
            .withIncludeHandler(this._makeIncludeHandler())
            .setGlobal(global);
        try {
            const source = fs.readFileSync(componentAbsPath, { encoding: 'utf-8' });
            const func = await compiler.compileToFunction(source);
            return await func(runtime);
        } catch (e) {
            logger.warn(`cannot run file ${componentAbsPath}, an error occurred ${e}`);
        }
        return null;
    }

    ////////////////////////////////////////// COMPILATION

    /**
     * Get the compiler object base on resource type
     * @param {string} resourceType
     * @returns {Compiler} compiler
     */
    _getCompiler(resourceType) {
        const runtimeVars = ['resource', 'properties', 'wcmmode', 'resourceResolver', 'pageProperties'].concat(
            this.bindings.names
        );

        return new Compiler()
            .withScriptResolver(this._makeScriptResolver(resourceType))
            .withModuleImportGenerator(this._makeModuleImportGenerator(resourceType))
            .withRuntimeVar(runtimeVars);
    }

    /**
     * Make a script resolver
     * This method is used to resolve data-sly-use call to templates
     * @param {string} resourceType
     * @returns {(baseDir, uri) => string} The resolve script
     */
    _makeScriptResolver(resourceType) {
        return (baseDir, uri) => {
            let res = this.htlResourceResolver.getResource(path.join(resourceType, baseDir, uri));
            if (!res) res = this.htlResourceResolver.getResource(path.join(baseDir, uri));
            if (!res) res = this.htlResourceResolver.getResource(uri);
            return this.htlResourceResolver.getSystemPath(res.getPath());
        };
    }

    /**
     * Make a module import generator
     * This method is used to resolve data-sly-use call to models
     * @param {string} resourceType
     * @returns {(baseDir, varName, moduleId) => string} The module import function
     */
    // eslint-disable-next-line no-unused-vars
    _makeModuleImportGenerator(resourceType) {
        return (baseDir, varName, moduleId) => {
            const res = this.htlResourceResolver.getResource(path.join(resourceType, baseDir, moduleId));
            if (!res) return null;

            let absPath = this.htlResourceResolver.getSystemPath(res.getPath());
            return `
                const ${varName} = (require('${path.resolve(__dirname, 'model.js')}')).make('${absPath}');
            `;
        };
    }
    //////////////////// RUNTIME

    /**
     * Make a resource loader
     * A resource loader is a function that use runtime and resource name to product HTML
     * Resource Loader resolves data-sly-resource
     * @returns {(runtime, name) => string} Resource Loader
     */
    _makeResourceLoader() {
        return async (runtime, name, options) => {
            const parentGlobals = runtime.globals;
            const parent = parentGlobals.resource;

            const nameSplit = name.split('.');
            const resourceName = nameSplit[0];
            let selectors = null;
            if (nameSplit.length > 1) {
                selectors = nameSplit.slice(1).join('.');
            }

            let resource = parent.getChild(resourceName);
            if (!resource && options.resourceType) {
                resource = parentGlobals.resourceResolver.makeSynteticResource(
                    {},
                    parent.path + '/' + name,
                    options.resourceType
                );
            }

            let newGlobals = {
                pageProperties: parentGlobals.pageProperties,
                resourceResolver: parentGlobals.resourceResolver,
                wcmmode: parentGlobals.wcmmode,
                resource: resource,
                properties: resource.getValueMap(),
            };

            let globals = {
                ...newGlobals,
                ...this.bindings.provide(resource, newGlobals),
            };

            const htlResource = this.htlResourceResolver.getResource(resource.getResourceType());
            if (!htlResource) {
                return null;
            }
            const componentPath = this.htlResourceResolver.getSystemPath(htlResource.getPath());
            const componentName = path.basename(componentPath);
            const componentHtmlFileAbs =
                selectors == null || selectors.length == 0
                    ? path.join(componentPath, `${componentName}.html`)
                    : path.join(componentPath, `${selectors}.html`);
            return await this._rendFile(componentHtmlFileAbs, globals);
        };
    }

    /**
     * Make a include handler
     * A include handler is a function that use runtime and a file path to produce HTML
     * Include Handler resolves data-sly-include
     * @returns {async (runtime, name) => string} Include handler
     */
    _makeIncludeHandler() {
        return async (runtime, file) => {
            const absFile = path.resolve(file);
            const globals = runtime.globals;
            return await this._rendFile(absFile, globals);
        };
    }
}

module.exports = HTLRender;

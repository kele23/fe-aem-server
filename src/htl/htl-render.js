const { Compiler, Runtime } = require('@adobe/htlengine');
const path = require('path').posix; // only forward slash
const fs = require('fs');
const Model = require('./model');
const BindingsProvider = require('./bindings-provider');
const logger = require('../utils/logger');
const ResourceResolver = require('../resources/resource-resolver');

class HTLRender {
    /**
     *
     * @param {BindingsProvider} bindings The BindingsPro
     * @param {Object} options Compilation options
     */
    constructor(repoReaders, { modelAlias, hotComponents }) {
        this.htlResourceResolver = new ResourceResolver(repoReaders);
        this.bindings = new BindingsProvider({}, modelAlias, this.htlResourceResolver);
        this.hotComponents = hotComponents;
    }

    /**
     * Render a resource
     * @param {Resource} the resource
     * @param {Object} compilationOptions
     * @returns {string} HTML
     */
    async rendComponent(componentResource, selectors = [], request) {
        // get resource resolver
        const htlResource = this.htlResourceResolver.getResource(componentResource.getResourceType());
        if (!htlResource) {
            return `<div style="color: #AD0021; padding:8px; background-color: white; border: 1px solid #AD0021;"> resource type not found: ${componentResource.getResourceType()}</div>`;
        }

        // get system path
        const componentPath = htlResource.getPath();
        if (!componentPath) {
            return `<div style="color: #AD0021; padding:8px; background-color: white; border: 1px solid #AD0021;"> resource type not found: ${componentResource.getResourceType()}</div>`;
        }

        const componentName = path.basename(componentPath);

        let componentHtmlFile = null;
        if (selectors.length > 0) {
            const selectorHtmlFile = path.join(componentPath, `${selectors.join('.')}.html`);
            if (this.htlResourceResolver.getResource(selectorHtmlFile)) componentHtmlFile = selectorHtmlFile;
        }
        if (!componentHtmlFile) componentHtmlFile = path.join(componentPath, `${componentName}.html`);

        // check file exists
        if (!this.htlResourceResolver.getResource(componentHtmlFile)) {
            return `<div style="color: #AD0021; padding:8px; background-color: white; border: 1px solid #AD0021;"> htl render file not found: ${componentHtmlFile}</div>`;
        }

        // set page properties
        let pageProperties = null;
        let current = componentResource;
        while (current != null && current.getResourceType() != 'cq/page') current = current.getParent();
        if (current != null) pageProperties = current.getChild('jcr:content').getValueMap();

        // set global properties
        let global = {
            wcmmode: { disabled: true },
            resource: componentResource,
            resourceResolver: componentResource.getResourceResolver(),
            properties: componentResource.getValueMap(),
            pageProperties,
            request: request,
            usedFiles: [],
        };

        global = {
            ...global,
            ...this.bindings.provide(componentResource, global),
            provider: function (absPath) {
                return Model.make(absPath);
            },
        };

        return await this._rendFile(componentHtmlFile, global, { wrapper: true });
    }

    /**
     * Render an htl file
     * @param {string} componentPath
     * @param {Object} global
     * @returns {string} HTML
     */
    async _rendFile(filePath, global, { wrapper = false, absolutePath = false, decoration = null }) {
        const resourceType = global.resource.getResourceType();

        const compiler = this._getCompiler(resourceType, global);
        const runtime = new Runtime()
            .withResourceLoader(this._makeResourceLoader())
            .withIncludeHandler(this._makeIncludeHandler())
            .setGlobal(global);
        try {
            let source = '';
            if (!absolutePath) {
                global.usedFiles.push(filePath);
                source = await this.htlResourceResolver.readText(filePath);
            } else source = fs.readFileSync(filePath, 'utf-8');

            if (decoration) {
                const { tagName, classes, otherAttributes } = decoration;
                source =
                    `<${tagName} class="${classes.join(' ')}" ${otherAttributes.join(' ')}>` + source + `</${tagName}>`;
            }

            const func = await compiler.compileToFunction(source);
            let result = await func(runtime);

            // add wrapper for hot components
            if (this.hotComponents && wrapper && global.resource.getPath().indexOf('jcr:content/') > 0) {
                result =
                    `<meta data-type="start" data-path="${global.resource.getPath()}"/>\n` +
                    result +
                    `<meta data-type="end" data-decoration="${!!decoration}" data-resource-type="${resourceType}" 
                        data-path="${global.resource.getPath()}" data-usedfiles="${global.usedFiles.join(';')}" />\n`;
            }
            return result;
        } catch (e) {
            logger.warn(`Cannot run file ${filePath} for resource ${global.resource.getPath()}`);
            logger.warn(`>> ${e.message} -- ${e.stack}`);
        }
        return null;
    }

    ////////////////////////////////////////// COMPILATION

    /**
     * Get the compiler object base on resource type
     * @param {string} resourceType
     * @returns {Compiler} compiler
     */
    _getCompiler(resourceType, global) {
        const runtimeVars = [
            'resource',
            'properties',
            'wcmmode',
            'resourceResolver',
            'pageProperties',
            'provider',
        ].concat(this.bindings.names);

        return new Compiler()
            .withScriptResolver(this._makeScriptResolver(resourceType, global))
            .withModuleImportGenerator(this._makeModuleImportGenerator(resourceType, global))
            .withRuntimeVar(runtimeVars);
    }

    /**
     * Make a script resolver
     * This method is used to resolve data-sly-use call to templates
     * @param {string} resourceType
     * @returns {(baseDir, uri) => string} The resolve script
     */
    _makeScriptResolver(resourceType, global) {
        return (baseDir, uri) => {
            let res = this.htlResourceResolver.getResource(uri);
            if (!res) res = this.htlResourceResolver.getResource(path.join(resourceType, uri));
            if (!res) res = this.htlResourceResolver.getResource(path.join(baseDir, uri));
            if (!res) res = this.htlResourceResolver.getResource(path.join(resourceType, baseDir, uri));

            if (res) {
                // add file to global used
                global.usedFiles.push(res.getPath());

                // run
                const componentPath = this.htlResourceResolver.getSystemPath(res.getPath());
                if (!componentPath) {
                    logger.warn('Cannot find component path ' + res.getPath());
                    return null;
                }
                return componentPath;
            }
            throw new Error(`Cannot find template ${baseDir} ${uri}`);
        };
    }

    /**
     * Make a module import generator
     * This method is used to resolve data-sly-use call to models
     * @param {string} resourceType
     * @returns {(baseDir, varName, moduleId) => string} The module import function
     */
    // eslint-disable-next-line no-unused-vars
    _makeModuleImportGenerator(resourceType, global) {
        return (baseDir, varName, moduleId) => {
            let join = path.join(resourceType, baseDir, moduleId);

            // first on current resourceType folder
            let res = this.htlResourceResolver.getResource(join);

            // second on current resource type folder + js
            if (!res) {
                join = join.concat('.js');
                res = this.htlResourceResolver.getResource(join);
            }

            // third on models folder + js
            if (!res) {
                join = `_models/${moduleId}.js`;
                res = this.htlResourceResolver.resolve(join);
            }

            if (!res) {
                logger.warn('Cannot find module {}', moduleId);
                return null;
            }

            // add file to global used
            global.usedFiles.push(res.getPath());

            // run
            let absPath = this.htlResourceResolver.getSystemPath(res.getPath());
            return `
                const ${varName} = function(){
                    return provider('${absPath.replaceAll('\\', '\\\\')}');
                };
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
            const resourceResolver = parentGlobals.resourceResolver;

            let resource = null;
            let selectors = [];

            let rsPath = name;
            if (!rsPath.startsWith('/')) {
                rsPath = parent.getPath() + '/' + name;
            }

            // extract selectors
            let parse = path.parse(rsPath);
            while (parse.ext) {
                selectors = [parse.ext.substring(1), ...selectors];
                rsPath = parse.dir + '/' + parse.name;
                parse = path.parse(rsPath);
            }

            // resolve resource with resourceType hint
            resource = resourceResolver.resolve(rsPath, options.resourceType);

            let newGlobals = {
                pageProperties: parentGlobals.pageProperties,
                resourceResolver: resourceResolver,
                wcmmode: parentGlobals.wcmmode,
                resource: resource,
                properties: resource.getValueMap(),
                request: parentGlobals.request,
                usedFiles: [],
            };

            let globals = {
                ...newGlobals,
                ...this.bindings.provide(resource, newGlobals),
                provider: function (absPath) {
                    return Model.make(absPath);
                },
            };

            const htlResource = this.htlResourceResolver.getResource(resource.getResourceType());
            if (!htlResource) {
                return `<div style="color: #AD0021; padding:8px; background-color: white; border: 1px solid #AD0021; margin: 8px;"> resource type not found: ${resource.getResourceType()}</div>`;
            }

            // get system path
            const componentPath = htlResource.getPath();
            if (!componentPath) {
                return `<div style="color: #AD0021; padding:8px; background-color: white; border: 1px solid #AD0021; margin: 8px;"> resource type not found: ${resource.getResourceType()}</div>`;
            }

            const componentName = path.basename(componentPath);

            let componentHtmlFile = null;
            if (selectors.length > 0) {
                const selectorHtmlFile = path.join(componentPath, `${selectors.join('.')}.html`);
                if (this.htlResourceResolver.getResource(selectorHtmlFile)) componentHtmlFile = selectorHtmlFile;
            }
            if (!componentHtmlFile) componentHtmlFile = path.join(componentPath, `${componentName}.html`);

            const decoration = await this._createDecoration(resource, componentPath, options);
            return await this._rendFile(componentHtmlFile, globals, { wrapper: true, decoration });
        };
    }

    async _createDecoration(resource, componentPath, options) {
        if (!('decoration' in options) || !options.decoration) return null;

        const cmpNameSplit = resource.getResourceType().split('/');

        let classes = [cmpNameSplit[cmpNameSplit.length - 1]];
        let tagName = 'div';
        let otherAttributes = [];

        // load htmlTag file
        const htmlTagFile = path.join(componentPath, 'htmlTag.json');
        if (this.htlResourceResolver.getResource(htmlTagFile)) {
            const source = await this.htlResourceResolver.readText(htmlTagFile);
            const htmlTagObj = JSON.parse(source);

            tagName = htmlTagObj?.tagName ? htmlTagObj?.tagName : tagName;
            classes = htmlTagObj?.classes ? [...htmlTagObj?.classes] : classes;

            for (const key in htmlTagObj) {
                const value = htmlTagObj[key];
                if (key == 'tagName' || key == 'classes') continue;
                otherAttributes.push(`${key}="${value}"`);
            }
        }

        // extra classes from data-sly-resource
        if (options.cssClassName) classes = [...classes, ...options.cssClassName.split(' ')];

        return {
            tagName,
            classes,
            otherAttributes,
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
            return await this._rendFile(absFile, globals, { absolutePath: true });
        };
    }
}

module.exports = HTLRender;

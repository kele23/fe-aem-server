const fs = require('fs');
const path = require('path');
const vm = require('vm');
const logger = require('../utils/logger');

class Model {
    constructor(mpath) {
        this.mpath = mpath;
    }

    use(globals) {

        if (!fs.existsSync(this.mpath)) {
            logger.warn(`Cannot find model with path: ${this.mpath}`);
            return {};
        }


        try {
       
            const vmContext = vm.createContext({
                use: (deps = [], fn = null) => {
                    //deps could be the fn
                    if (!Array.isArray(deps)) {
                        fn = deps;
                        deps = [];
                    }
                    //load dependencies
                    const objs = [];
                    for (const dep of deps) {
                        const depFilePath = path.resolve(this.mpath, dep);
                        var depM = new Model(depFilePath);
                        objs.push(depM.use(globals));
                    }
                    return fn.apply(globals, objs);
                },
                console: logger,
                exports,
                require,
                module,
                __filename,
                __dirname,
            });

       
            const source = fs.readFileSync(this.mpath, { encoding: 'utf-8' });
            const vmScript = new vm.Script(source);
            return vmScript.runInContext(vmContext);
        } catch (e) {
            logger.warn('Cannot exec model ' + this.mpath);
            logger.warn('>> resource ' + globals.resource.getPath());
            logger.warn(`>> ${e.message} -- ${e.stackTrace}`);
        }
    }

    static make(mpath) {
        return new Model(mpath);
    }
}

module.exports = Model;

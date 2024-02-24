const RepoReader = require('../repo-reader');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { deepGet, mergeDeepToPath, objectEquals } = require('../../../utils/utils');

class StaticRepositoryReader extends RepoReader {
    constructor(basePath, repoDir, options) {
        super(basePath);
        this.sourceDir = repoDir;
        this.options = options || {};
        this.ctx = {};

        this._addFsListener();
    }

    get(repoPath) {
        const value = this._getFromCtx(repoPath);
        if (value && !value.tobecontinue) return value;

        // load base path
        let basePath = repoPath;
        if (repoPath.indexOf('jcr:content') >= 0) {
            basePath = repoPath.substring(0, repoPath.indexOf('jcr:content') - 1);
        }

        const systemPath = this.getSystemPath(repoPath);
        if (!systemPath) return null;

        const data = this._loadData(systemPath);
        this._addToCtx(data, basePath);
        return this._getFromCtx(repoPath);
    }

    _loadData(systemPath) {
        const binaryFile = !systemPath.endsWith('.json');

        let data = null;
        if (binaryFile) {
            //binary file or folder
            data = {
                'sling:resourceType': fs.statSync(systemPath).isDirectory() ? 'sling/Folder' : 'nt/file',
                tobecontinue: false,
            };
        } else {
            // json file ( read it )
            const source = this._checkNesting(fs.readFileSync(systemPath, 'utf8'), systemPath);
            data = {
                ...JSON.parse(source),
                tobecontinue: false,
            };

            // read sibling items
            if (fs.existsSync(this.sourceDir + systemPath) && fs.statSync(this.sourceDir + systemPath).isDirectory()) {
                const names = fs
                    .readdirSync(this.sourceDir + systemPath, { withFileTypes: true })
                    .map((dirent) => dirent.name)
                    .filter((name) => name != 'index.json')
                    .map((name) => (name.endsWith('.json') ? name.substring(0, name.indexOf('.json')) : name));

                for (let name of names) {
                    data[name] = { tobecontinue: true };
                }
            }
        }

        return data;
    }

    getSystemPath(repoPath) {
        let basePath = repoPath;
        if (repoPath.indexOf('jcr:content') >= 0) {
            basePath = repoPath.substring(0, repoPath.indexOf('jcr:content') - 1);
        }

        const systemPath = basePath.split(path.posix.sep).join(path.sep);

        //json extension
        let finalPath = this.sourceDir + systemPath + '.json';
        if (!fs.existsSync(finalPath)) {
            //folder and json extension
            finalPath = this.sourceDir + systemPath + path.sep + 'index.json';
            if (!fs.existsSync(finalPath)) {
                //take as binary file
                finalPath = this.sourceDir + systemPath;
                if (!fs.existsSync(finalPath)) {
                    return null;
                }
            }
        }
        return finalPath;
    }

    revertSystemPath(systemPath) {
        const tmpPath = systemPath.replace(this.sourceDir, '');
        let finalPath = tmpPath.split(path.sep).join(path.posix.sep);
        if (finalPath.endsWith('/index.json')) finalPath = finalPath.replace('/index.json', '');
        if (finalPath.endsWith('.json')) finalPath = finalPath.replace('.json', '');
        return finalPath;
    }

    async readText(repoPath) {
        const systemPath = this.getSystemPath(repoPath);
        if (!systemPath) return null;
        const txt = fs.readFileSync(systemPath, { encoding: 'utf-8' });
        if (!this.options.transformSource) return txt;
        return await this.options.transformSource(txt, { repoPath, systemPath });
    }

    _checkNesting(source, fsPath) {
        const dir = path.dirname(fsPath);
        return source.replace(/"##REF:([^"]+)"/g, (match, $1) => {
            const filePath = path.join(dir, $1);
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf-8');
            }
            return 'null';
        });
    }

    _addFsListener() {
        let timeout;
        const changes = new Set();
        chokidar.watch(this.sourceDir).on('change', (systemPath) => {
            if (timeout) clearTimeout(timeout);
            changes.add(systemPath);

            timeout = setTimeout(() => {
                // iterate changes
                for (const change of Array.from(changes)) {
                    const repoPath = this.revertSystemPath(change);
                    const data = this._loadData(change);
                    const oldData = this._getFromCtx(repoPath);

                    let changed = [];
                    if (data['sling:resourceType'] == 'nt/file' || oldData['sling:resourceType'] == 'nt/file') {
                        changed = [repoPath];
                    } else {
                        changed = objectEquals(data, oldData, repoPath);
                    }

                    this._addToCtx(data, repoPath);
                    for (const ch of changed) {
                        this._changed(ch);
                    }
                }

                // reset changes
                changes.clear();
            }, 200);
        });
    }

    /**
     * Get the object from the context
     * @param {*} repoPath The path
     * @param {*} ctx The ctx object
     * @returns An object from the ctx
     */
    _getFromCtx(repoPath) {
        return deepGet(this.ctx, repoPath);
    }

    /**
     * Adds repository data to the ctx
     * @param {*} data The repository data
     * @param {*} basePath The basePath ( of where starts the data )
     */
    _addToCtx(data, basePath) {
        this.ctx = mergeDeepToPath(this.ctx, data, basePath);
    }
}

module.exports = StaticRepositoryReader;

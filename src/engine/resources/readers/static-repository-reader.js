import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import RepoReader from '../repo-reader.js';
import { deepGet, mergeDeepToPath, objectEquals } from '../../../utils/utils.js';
import YAML from 'yaml';
import Logger from '../../../utils/logger.js';

// json file = page
class StaticRepositoryReader extends RepoReader {
    constructor(basePath, repoDir, options) {
        super(basePath);
        this.sourceDir = repoDir;
        this.options = options || {};

        this.loaded = [];
        this.fileCache = {};
        this._addFsListener();
    }

    get(repoPath) {
        const systemPath = this.getSystemPath(repoPath);
        if (!systemPath) return null;

        const data = this._absData(this._loadData(systemPath), repoPath);
        return deepGet(data, repoPath);
    }

    getSystemPath(repoPath) {
        let basePath = repoPath;
        if (repoPath.indexOf('jcr:content') >= 0) {
            basePath = repoPath.substring(0, repoPath.indexOf('jcr:content') - 1);
        }

        const systemPath = basePath.split(path.posix.sep).join(path.sep);

        //json extension
        let finalPath = this.sourceDir + systemPath + '.json';
        if (fs.existsSync(finalPath)) return finalPath;

        //yml extension
        finalPath = this.sourceDir + systemPath + '.yml';
        if (fs.existsSync(finalPath)) return finalPath;

        //folder and json extension
        finalPath = this.sourceDir + systemPath + path.sep + 'index.json';
        if (fs.existsSync(finalPath)) return finalPath;

        //folder and yml extension
        finalPath = this.sourceDir + systemPath + path.sep + 'index.yml';
        if (fs.existsSync(finalPath)) return finalPath;

        //take as binary file
        finalPath = this.sourceDir + systemPath;
        if (fs.existsSync(finalPath)) return finalPath;

        return null;
    }

    revertSystemPath(systemPath) {
        const tmpPath = systemPath.replace(this.sourceDir, '');
        let finalPath = tmpPath.split(path.sep).join(path.posix.sep);
        if (finalPath.endsWith(path.sep + 'index.json')) finalPath = finalPath.replace(path.sep + 'index.json', '');
        if (finalPath.endsWith(path.sep + 'index.yml')) finalPath = finalPath.replace(path.sep + 'index.yml', '');
        if (finalPath.endsWith('.json')) finalPath = finalPath.replace('.json', '');
        if (finalPath.endsWith('.yml')) finalPath = finalPath.replace('.yml', '');
        return finalPath;
    }

    async readText(repoPath) {
        const systemPath = this.getSystemPath(repoPath);
        if (!systemPath) return null;
        const txt = fs.readFileSync(systemPath, { encoding: 'utf-8' });
        if (!this.options.transformSource) return txt;
        return await this.options.transformSource(txt, { repoPath, systemPath });
    }

    _getFileFromCache(filename) {
        // read file, optionally from cache
        let source = this.fileCache[filename];
        if (!source) {
            const data = fs.readFileSync(filename, 'utf8');
            this.fileCache[filename] = data;
            source = data;
        }

        // convert into object
        try {
            if (filename.endsWith('.json')) return JSON.parse(source);
            return YAML.parse(source);
        } catch (e) {
            Logger.warn(e);
        }
        return {};
    }

    _absData(data, repoPath) {
        // obtain first jcr:content
        let basePath = repoPath;
        if (repoPath.indexOf('jcr:content') >= 0) {
            basePath = repoPath.substring(0, repoPath.indexOf('jcr:content') - 1);
        }

        // add obj into repoObj on basePath
        const repoObj = {};
        mergeDeepToPath(repoObj, data, basePath);
        return repoObj;
    }

    _loadData(systemPath) {
        const binaryFile = !systemPath.endsWith('.json') && !systemPath.endsWith('.yml');

        let data = null;
        if (binaryFile) {
            //binary file or folder
            data = {
                'sling:resourceType': fs.statSync(systemPath).isDirectory() ? 'sling/Folder' : 'nt/file',
            };
        } else {
            // read source
            data = this._checkNesting(this._getFileFromCache(systemPath), systemPath);
        }

        // load children objects
        if (systemPath.endsWith('index.json') || systemPath.endsWith('index.yml')) {
            const files = fs.readdirSync(path.dirname(systemPath));
            for (const file of files) {
                if (file == 'index.json' || file == 'index.yml') continue;
                data[file.replace('.json', '').replace('.yml', '')] = {};
            }
        }

        return data;
    }

    _checkNesting(data, fsPath) {
        const dir = path.dirname(fsPath);
        const source = JSON.stringify(data);
        const result = source.replace(/"##REF:([^"]+)"/g, (match, $1) => {
            const filePath = path.join(dir, $1);
            if (fs.existsSync(filePath)) {
                return JSON.stringify(this._getFileFromCache(filePath));
            }
            return 'null';
        });

        return JSON.parse(result);
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
                    // get repo path of the change
                    const repoPath = this.revertSystemPath(change);

                    // content change! no cache = trigger repo path change ( page or file )
                    if (!this.fileCache[change]) {
                        this._changed(repoPath);
                        continue;
                    }

                    // get old data for this change
                    const oldData = this._absData(this._loadData(change), repoPath);
                    // delete cache
                    delete this.fileCache[change];
                    // get new data
                    const data = this._absData(this._loadData(change), repoPath);

                    let changed = [];
                    if (data && oldData) {
                        if (data['sling:resourceType'] == 'nt/file' || oldData['sling:resourceType'] == 'nt/file') {
                            changed = [repoPath];
                        } else {
                            changed = objectEquals(data, oldData);
                        }
                    }

                    // check changed
                    for (const ch of changed) {
                        let tmpCh = ch;
                        let dt = deepGet(data, tmpCh);
                        while (tmpCh.length > 1 && (!dt || !dt['sling:resourceType'])) {
                            const split = tmpCh.split('/');
                            tmpCh = split.slice(0, split.length - 1).join('/');
                            dt = deepGet(data, tmpCh);
                        }

                        this._changed(tmpCh);
                    }
                }

                // reset changes
                changes.clear();
            }, 200);
        });
    }
}

export default StaticRepositoryReader;

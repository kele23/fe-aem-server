const RepoReader = require('../repo-reader');
const fs = require('fs');
const path = require('path');

class StaticRepositoryReader extends RepoReader {
    constructor(basePath, repoDir) {
        super(basePath);
        this.sourceDir = repoDir;
    }

    _innerGet(repoPath, ctx) {
        const value = this._getFromCtx(repoPath, ctx);
        if (value) return value;

        let basePath = repoPath;
        if (repoPath.indexOf('jcr:content') >= 0) {
            basePath = repoPath.substring(0, repoPath.indexOf('jcr:content') - 1);
        }

        //json extension
        let finalPath = this.sourceDir + basePath + '.json';
        let binaryFile = false;
        if (!fs.existsSync(finalPath)) {
            //folder and json extension
            finalPath = this.sourceDir + basePath + '/index.json';
            if (!fs.existsSync(finalPath)) {
                //take as binary file
                finalPath = this.sourceDir + basePath;
                binaryFile = true;
                if (!fs.existsSync(finalPath)) {
                    return null;
                }
            }
        }

        let data = null;
        if (binaryFile) {
            //binary file or folder
            data = {
                'sling:resourceType': fs.statSync(finalPath).isDirectory() ? 'sling/Folder' : 'nt/file',
            };
        } else {
            //json file ( read it )
            const source = this._checkNesting(fs.readFileSync(finalPath, 'utf8'), finalPath);
            data = JSON.parse(source);
        }

        this._addToCtx(data, basePath, ctx);
        return this._getFromCtx(repoPath, ctx);
    }

    _innerSystemPath(repoPath) {
        let basePath = repoPath;
        if (repoPath.indexOf('jcr:content') >= 0) {
            basePath = repoPath.substring(0, repoPath.indexOf('jcr:content') - 1);
        }

        let finalPath = this.sourceDir + basePath + '.json';
        if (!fs.existsSync(finalPath)) {
            //folder and json extension
            finalPath = this.sourceDir + basePath + '/index.json';
            if (!fs.existsSync(finalPath)) {
                //take as binary file
                finalPath = this.sourceDir + basePath;
                if (!fs.existsSync(finalPath)) {
                    return null;
                }
            }
        }
        return finalPath;
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
}

module.exports = StaticRepositoryReader;

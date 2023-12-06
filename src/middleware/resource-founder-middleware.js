const { addData, getData } = require('../utils/request-variables-utils');
const path = require('path');

const rfMiddleware = () => {
    return async (req, res, next) => {
        const resourceResolver = getData(req, 'resourceResolver');

        // request path
        let ph = req.baseUrl + req.path;

        // extract suffix
        let suffix = '';
        if (ph.indexOf('.html') >= 0) {
            suffix = ph.substring(ph.indexOf('.html') + 5);
            ph = ph.substring(0, ph.indexOf('.html') + 5);
        }

        // get extension
        let parse = path.parse(ph);
        ph = parse.dir + '/' + parse.name;
        const ext = parse.ext;

        // extract selectors
        let selectors = [];
        parse = path.parse(ph);
        while (parse.ext) {
            selectors = [parse.ext.substring(1), ...selectors];
            ph = parse.dir + '/' + parse.name;
            parse = path.parse(ph);
        }

        // fix double /
        if (ph.startsWith('//')) ph = ph.substring(1);

        // re-add extension if not html
        if (ext != '.html') ph = ph + ext;

        addData(req, 'requestedSelectors', selectors);
        addData(req, 'requestedSuffix', suffix);
        addData(req, 'requestedPath', ph);

        const resource = resourceResolver.resolve(ph);
        addData(req, 'requestedResource', resource);

        next();
    };
};

module.exports = rfMiddleware;

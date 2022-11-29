const { addData, getData } = require('../utils/request-variables-utils');
const path = require('path');

const rfMiddleware = () => {
    return async (req, res, next) => {
        //elaborate url -> path
        const ph = req.baseUrl + req.path;
        const parse = path.parse(ph);

        const resourceResolver = getData(req, 'resourceResolver');

        //get resource
        let name = parse.name;
        let selectors = [];
        let resource = resourceResolver.getResource(parse.dir + '/' + name);
        while (resource == null && name.indexOf('.') >= 0) {
            //add selector
            let sel = name.substring(name.lastIndexOf('.') + 1);
            selectors.unshift(sel);
            //get new name
            name = name.substring(0, name.lastIndexOf('.'));
            resource = resourceResolver.getResource(parse.dir + '/' + name);
        }

        const selectorsString = selectors.join('.');
        addData(req, 'requestedResource', resource);
        addData(req, 'requestedSelectors', selectorsString);
        next();
    };
};

module.exports = rfMiddleware;

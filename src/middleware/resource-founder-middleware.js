const { addData, getData } = require('../utils/request-variables-utils');
const path = require('path');

const rfMiddleware = () => {
    return async (req, res, next) => {
        const resourceResolver = getData(req, 'resourceResolver');

        //elaborate resource
        const ph = req.baseUrl + req.path;
        const parse = path.parse(ph);
        const resource = resourceResolver.resolve(parse.dir + '/' + parse.name);

        // get selectors
        let selectorsString = parse.name.replace(resource.getName(), '');
        if (selectorsString) selectorsString = selectorsString.substring(1);

        addData(req, 'requestedResource', resource);
        addData(req, 'requestedSelectors', selectorsString);
        next();
    };
};

module.exports = rfMiddleware;

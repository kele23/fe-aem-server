const findResource = require('../../engine/resources/resource-founder');
const { addData, getData } = require('../utils/request-variables-utils');

const rfMiddleware = () => {
    return async (req, res, next) => {
        const resourceResolver = getData(req, 'resourceResolver');

        // request url
        let url = req.baseUrl + req.path;
        const { resource, selectors, suffix, ph } = findResource(url, resourceResolver);

        // add request variables
        addData(req, 'requestedSelectors', selectors);
        addData(req, 'requestedSuffix', suffix);
        addData(req, 'requestedPath', ph);
        addData(req, 'requestedResource', resource);

        next();
    };
};

module.exports = rfMiddleware;

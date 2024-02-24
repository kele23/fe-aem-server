const { addData } = require('../utils/request-variables-utils');
const ResourceResolver = require('../../engine/resources/resource-resolver');

const rrMiddleware = (repoReadersObj) => {
    return async (req, res, next) => {
        const resourceResolver = new ResourceResolver(repoReadersObj, req);
        addData(req, 'resourceResolver', resourceResolver);
        next();
    };
};

module.exports = rrMiddleware;

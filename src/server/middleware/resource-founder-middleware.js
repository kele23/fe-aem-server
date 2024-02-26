import findResource from '../../engine/resources/resource-founder.js';
import { addData, getData } from '../utils/request-variables-utils.js';

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

export default rfMiddleware;

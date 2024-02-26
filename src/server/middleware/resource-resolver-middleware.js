import { addData } from '../utils/request-variables-utils.js';
import ResourceResolver from '../../engine/resources/resource-resolver.js';

const rrMiddleware = (repoReadersObj) => {
    return async (req, res, next) => {
        const resourceResolver = new ResourceResolver(repoReadersObj, req);
        addData(req, 'resourceResolver', resourceResolver);
        next();
    };
};

export default rrMiddleware;

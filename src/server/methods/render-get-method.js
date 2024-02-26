import Logger from '../../utils/logger.js';
import { getData } from '../utils/request-variables-utils.js';
import path from 'path';

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const mtRender = (render) => {
    return async (req, res) => {
        const resource = getData(req, 'requestedResource');
        const selectors = getData(req, 'requestedSelectors');
        const resolver = getData(req, 'resourceResolver');

        if (resource.getResourceType() == 'sling:nonexisting') {
            Logger.info(`Cannot find resource ${resource.getPath()}`);
            res.status(404);
            res.sendFile(path.resolve(__dirname, '../static/not-found.html'));
            return;
        }

        if (resource.getResourceType() == 'nt/file') {
            res.sendFile(resolver.getSystemPath(resource.getPath()));
        } else {
            const html = await render.rendComponent(resource, selectors, req);
            res.send(html);
        }
    };
};

export default mtRender;

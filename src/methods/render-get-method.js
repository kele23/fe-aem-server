const { getData } = require('../utils/request-variables-utils');

const mtRender = (render) => {
    return async (req, res) => {
        const resource = getData(req, 'requestedResource');
        const selectors = getData(req, 'requestedSelectors');
        if (resource == null) {
            res.status(404);
            res.send('NOT FOUND!');
            return;
        }

        const html = await render.rendComponent(resource, selectors, req);
        res.send(html);
    };
};

module.exports = mtRender;

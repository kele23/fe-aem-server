import path from 'path';

const findResource = (url, resourceResolver) => {
    // fix jcr:content url
    let ph = url.replace('_jcr_content', 'jcr:content');
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

    // check resource with and without extension
    let resource = resourceResolver.resolve(ph + ext);
    if (resource.getResourceType() != 'sling:nonexisting') {
        ph = ph + ext;
    } else {
        resource = resourceResolver.resolve(ph);
    }

    return { resource, selectors, suffix, ph };
};

export default findResource;

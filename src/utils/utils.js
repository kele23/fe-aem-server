///////////////////////////////////////////////////
//////////// DEEP MERGE
///////////////////////////////////////////////////
const isObject = (item) => {
    return item && typeof item === 'object' && !Array.isArray(item);
};

const mergeDeep = (target, ...sources) => {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key])
                    Object.assign(target, {
                        [key]: {},
                    });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, {
                    [key]: source[key],
                });
            }
        }
    }

    return mergeDeep(target, ...sources);
};

const mergeDeepToPath = (target, source, path) => {
    var paths = path.split('/').slice(1);
    let deepObj = createObjToPath(source, paths);
    const obj = mergeDeep(target, deepObj);
    return obj;
};

const createObjToPath = (target, paths) => {
    if (!paths || paths.length == 0) return target;

    const obj = {};
    obj[paths[0]] = createObjToPath(target, paths.slice(1));
    return obj;
};

const deepGet = (obj, path) => {
    let paths = path.split('/').slice(1);
    let current = obj;

    for (let i = 0; i < paths.length; ++i) {
        if (current[paths[i]] == undefined) {
            return null;
        } else {
            current = current[paths[i]];
        }
    }
    return current;
};

module.exports = {
    isObject,
    mergeDeep,
    mergeDeepToPath,
    deepGet,
};

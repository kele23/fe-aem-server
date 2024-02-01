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

function countProps(obj) {
    var count = 0;
    for (let k in obj) {
        // eslint-disable-next-line no-prototype-builtins
        if (obj.hasOwnProperty(k)) {
            count++;
        }
    }
    return count;
}

function objectEquals(v1, v2, path = '') {
    if (countProps(v1) !== countProps(v2)) {
        return [path];
    }

    var r = [];
    for (let k in v1) {
        let res = [];
        if (v1 instanceof Object && v2 instanceof Object) {
            res = objectEquals(v1[k], v2[k], `${path}/${k}`);
        } else {
            if (typeof v1 !== typeof v2) {
                res = [path];
            } else {
                res = v1 === v2 ? [] : [path];
            }
        }
        r = [...res, ...r];
    }
    return r;
}

module.exports = {
    isObject,
    mergeDeep,
    mergeDeepToPath,
    deepGet,
    objectEquals,
};

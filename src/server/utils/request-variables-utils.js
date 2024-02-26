const addData = (req, name, data) => {
    if (!req.wasdata) req.wasdata = {};
    req.wasdata[name] = data;
};

const getData = (req, name) => {
    return req.wasdata?.[name];
};

export { addData, getData };

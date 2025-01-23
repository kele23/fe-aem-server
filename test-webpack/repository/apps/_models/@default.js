/*global use*/
use(function () {
    return {
        uniqueId: Math.floor(Math.random() * 10000),
        ...this.properties,
    };
});

const HTLRender = require('./htl/htl-render');
const RepoReader = require('./resources/repo-reader');
const StaticRepositoryReader = require('./resources/readers/static-repository-reader');
const ResourceResolver = require('./resources/resource-resolver');
const Resource = require('./resources/resource');
const findResource = require('./resources/resource-founder');

module.exports = {
    HTLRender,
    RepoReader,
    StaticRepositoryReader,
    ResourceResolver,
    Resource,
    findResource,
};

const DSL_TYPE = 'dsl';

function extractDslRootData(rawData) {
    const dslData = {};
    const rowDataObject = JSON.parse(rawData);
    if (rowDataObject.type === DSL_TYPE){
        dslData.scenarios = rowDataObject.scenarios;
        dslData.before = rowDataObject.before;
    }
    return dslData;
}

module.exports = {
    extractDslRootData
};

const getConfig = (serverID, nosql) => {
    return nosql.get('config')
        .find({serverID: serverID})
        .value().config;
}

module.exports = {
    getConfig
}
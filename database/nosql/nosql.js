const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileASync')

const startDatabase = async (path) => {
    const adapter = new FileAsync(path);
    const db = await low(adapter);
    console.log(`Connected successfully to nosql db ${path}`);

    db.defaults(
        {
            config: [],
            tags: []
        }
    ).write()

    return db
}

module.exports = {
    startDatabase,
};
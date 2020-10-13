const { startDatabase } = require('./sqlite');
const { banish } = require('./banishment');

module.exports = { startDatabase, banish };

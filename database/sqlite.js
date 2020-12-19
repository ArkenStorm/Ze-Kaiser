const { Database } = require('sqlite3').verbose();

const startDatabase =  async (path) => {
	const connection = new Database(path);
	console.log(`Connected successfully to db ${path}`);


	await initalizeTables(connection);

	return connection;
}

const initalizeTables = async (connection) => {
	console.log("Successfully initalized tables");
}

module.exports = {
	startDatabase,
};

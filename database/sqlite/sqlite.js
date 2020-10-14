const { Database } = require('sqlite3');
const sqlite = require('sqlite');
// const process = require('process');
const { schemaUpdates: schemaUpdatesUnsorted } = require('./schemaUpdates');
const schemaUpdates = schemaUpdatesUnsorted.sort(
	(a, b) => a.updateNumber - b.updateNumber
);

const startDatabase = async (path) => {
	const db = await sqlite.open({
		filename: path,
		driver: Database,
	});
	console.log(`Connected successfully to db ${path}`);

	let currentSchemaVersion = 0;
	try {
		const result = await getSingleRow(
			db,
			'SELECT version_number from schema_version'
		);
		currentSchemaVersion = result.version_number;
	} catch (err) {
		// schema version at 0
	}

	const latestSchemaVersion =
		schemaUpdates[schemaUpdates.length - 1].updateNumber;
	if (currentSchemaVersion !== latestSchemaVersion) {
		runMigrations(db, schemaUpdates, currentSchemaVersion, latestSchemaVersion);

		console.log(
			`Updated schema from version ${currentSchemaVersion} to version ${latestSchemaVersion}`
		);
	} else {
		console.log(`Running schema version ${currentSchemaVersion}`);
	}

	return db;
};

const checkParams = (query, params) => {
	const expectedParamCount = (/\?/.exec(query) || []).length;
	if (expectedParamCount !== params.length) {
		throw new Error(
			`Invalid number of arguments for get query. Must have ${expectedParamCount}, received ${params.length}`
		);
	}
};

const getSingleRow = (connection, query, ...params) => {
	checkParams(query, params);
	return connection.get(query, ...params);
};

const getAllRows = (connection, query, ...params) => {
	checkParams(query, params);
	return connection.all(query, ...params);
};

const run = (connection, query, ...params) => {
	checkParams(query, params);
	return connection.run(query, ...params);
};

const runMigrations = (
	connection,
	updates,
	currentSchemaVersion,
	latestSchemaVersion
) => {
	const indexOfMigrationToStartOn = updates.findIndex(
		(el) => el.updateNumber > currentSchemaVersion
	);
	if (indexOfMigrationToStartOn === -1) {
		// on the most recent version
		return;
	}
	const updatesToRun = updates.slice(indexOfMigrationToStartOn);

	// Generally a bad idea, since we lose the nice promise wrapping, but serialize() isn't supported yet
	// https://github.com/kriasoft/node-sqlite/blob/master/docs/classes/_src_database_.database.md#serialize
	const rawDb = connection.getDatabaseInstance();
	// We want all schema updates to run in order and synchronously
	rawDb.serialize();
	const errFunc = (query) => (err) => {
		if (!err) {
			return;
		}
		console.error(`Failed to run migration with query\n${query}\n`, err);
		process.exit(1);
	};
	updatesToRun.forEach((m) => {
		rawDb.run(m.query, errFunc(m.query));
	});
	rawDb.run(
		'DELETE FROM schema_version',
		errFunc('DELETE FROM schema_version')
	);
	// Save the latest version
	rawDb.run(
		'INSERT INTO schema_version(version_number) VALUES(?)',
		latestSchemaVersion,
		errFunc('INSERT INTO schema_version(version_number) VALUES(?)')
	);
	// go back to parallel
	rawDb.parallelize();
};

module.exports = {
	startDatabase,
	run,
	getSingleRow,
	getAllRows,
};

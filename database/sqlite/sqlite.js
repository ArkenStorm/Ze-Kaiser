const { Database } = require('sqlite3');
const sqlite = require('sqlite');
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
		const result = await get(
			db,
			'SELECT version_number from schema_version'
		);
		currentSchemaVersion = result.version_number;
	} catch (err) {
		// just leave schema version at 0
	}

	const latestSchemaVersion =
		schemaUpdates[schemaUpdates.length - 1].updateNumber;
	if (currentSchemaVersion !== latestSchemaVersion) {
		await runMigrations(db, schemaUpdates);
		console.log(
			`Updated schema from version ${currentSchemaVersion} to version ${latestSchemaVersion}`
		);
	} else {
		console.log(`Running schema version ${currentSchemaVersion}`);
	}

	return db;
};

/**
 * Gets a single row
 * https://www.npmjs.com/package/sqlite#getting-a-single-row
 */
const get = (connection, query, ...params) => {
	const expectedParamCount = (/\?/.exec(query) || []).length;
	if (expectedParamCount !== params.length) {
		throw new Error(
			`Invalid number of arguments for get query. Must have ${expectedParamCount}, received ${params.length}`
		);
	}
	return connection.get(query, params);
};

const runMigrations = (
	connection,
	updates,
	currentVersionNumber,
	latestVersionNumber
) => {
	const indexOfMigrationToStartOn = updates.findIndex(el => el.updateNumber > currentVersionNumber);
	if (indexOfMigrationToStartOn === -1) {
		// on the most recent version
		return Promise.resolve();
	}
	const updatesToRun = updates.slice(indexOfMigrationToStartOn);

	// Generally a bad idea, since we lose the nice promise wrapping, but serialize() isn't supported yet
	// https://github.com/kriasoft/node-sqlite/blob/master/docs/classes/_src_database_.database.md#serialize
	const rawDb = connection.getDatabaseInstance();
	return new Promise((resolve) => {
		// We want all schema updates to run in order and synchronously
		rawDb.serialize(() => {
			updatesToRun.forEach((m) => {
				console.log(`Running schema update number ${m.updateNumber}`);
				rawDb.run(m.query);
			});
			// Save the latest version
			rawDb.run(
				'UPDATE schema_version SET version_number = ?, last_updated = ? WHERE version_number = ?',
				[latestVersionNumber, Date.now(), currentVersionNumber]
			);
			resolve();
		});
	});
};

module.exports = {
	startDatabase,
};

/**
 * A declarative way to manage your database schema. Place all table definitions and data changes here in order to keep backwards
 * compatibility and share schema across team members.
 */

const schemaUpdates = [
	{
		updateNumber: 1,
		// version_number is represents the current version of the schema, last_updated is a Unix epoch timestamp
		// of when it was updated.
		query: `CREATE TABLE IF NOT EXISTS schema_version(version_number INTEGER);`,
	},
	{
		updateNumber: 2,
		query: `CREATE TABLE IF NOT EXISTS banishments(channel_id TEXT NOT NULL, user_id TEXT NOT NULL);`,
	},
];

module.exports = {
	schemaUpdates,
};

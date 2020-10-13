/**
 * A declarative way to manage your database schema. Place all table definitions and data changes here in order to keep backwards
 * compatibility and share schema across team members.
 */

const schemaUpdates = [
	{
		updateNumber: 1,
		// version_number is represents the current version of the schema, last_updated is a Unix epoch timestamp
		// of when it was updated.
		query: `CREATE TABLE schema_version(
            version_number INTEGER, 
         );`,
	},
];

module.exports = {
	schemaUpdates,
};

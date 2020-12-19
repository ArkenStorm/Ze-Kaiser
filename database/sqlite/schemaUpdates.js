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
	{
		updateNumber: 3,
		query: `CREATE TABLE IF NOT EXISTS
				event(
					event_id INTEGER PRIMARY KEY,
					server_id TEXT NOT NULL,
					title TEXT NOT NULL UNIQUE,
					start_date_time TEXT NOT NULL,
					end_date_time TEXT NOT NULL,
					description TEXT,
					size TEXT,
					creator TEXT NOT NULL,
					reminder_date_time TEXT,
					repeat_id INTEGER
				);`
	},
	{
		updateNumber: 4,
		query: `CREATE TABLE IF NOT EXISTS
				attendee(
					user_id TEXT NOT NULL,
					event_id INTEGER NOT NULL,
					PRIMARY KEY (user_id, event_id),
					FOREIGN KEY (event_id) REFERENCES event (event_id)
				);`
	},
	{
		updateNumber: 5,
		query: `CREATE TABLE IF NOT EXISTS
				assignment(
					assignment_id INTEGER PRIMARY KEY,
					event_id INTEGER NOT NULL,
					description TEXT,
					FOREIGN KEY (event_id) REFERENCES event (event_id)
				);`
	},
	{
		updateNumber: 6,
		query: `CREATE TABLE IF NOT EXISTS
				assignee(
					user_id TEXT NOT NULL,
					assignment_id INTEGER NOT NULL,
					has_accepted INTEGER NOT NULL,
					PRIMARY KEY (user_id, assignment_id),
					FOREIGN KEY (assignment_id) REFERENCES assignment (assignment_id)
				);`
	}
];

module.exports = {
	schemaUpdates,
};

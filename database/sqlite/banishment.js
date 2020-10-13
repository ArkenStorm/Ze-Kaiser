/**
 * Functions about the banishment table
 */
const { run, getAllRows } = require('./sqlite');

const banish = (db, userIdsToBanish, channelId) => {
	let toBanish = userIdsToBanish;
	if (!Array.isArray(userIdsToBanish)) {
		toBanish = [userIdsToBanish];
	}
	console.log(toBanish);
	return Promise.all(
		toBanish.map((id) =>
			run(db, 'INSERT INTO banishments(channel_id, user_id) VALUES (?, ?)', [
				channelId,
				id,
			])
		)
	);
};

const unbanish = (db, userIdsToUnbanish, channelId) => {
	let toUnbanish = userIdsToUnbanish;
	if (!Array.isArray(userIdsToUnbanish)) {
		toUnbanish = [userIdsToUnbanish];
	}
	console.log('Unbanishing', toUnbanish);
	return Promise.all(
		toUnbanish.map((id) =>
			run(db, 'DELETE FROM banishments WHERE channel_id = ? AND user_id = ?', [
				channelId,
				id,
			])
		)
	);
};

const getChannelsAndBanishments = async (db) => {
	const results = await getAllRows(db, 'SELECT * from banishments');

	const usersPerChannel = new Map();

	results.forEach(({ channel_id, user_id }) => {
		if (!usersPerChannel.has(channel_id)) {
			usersPerChannel.set(channel_id, new Set());
		}
		usersPerChannel.get(channel_id).add(user_id);
	});

	return usersPerChannel;
};

module.exports = {
	banish,
	unbanish,
	getChannelsAndBanishments,
};

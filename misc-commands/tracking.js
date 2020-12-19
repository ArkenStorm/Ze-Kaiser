const track = async (context) => {
	let trackString = context.args.join(' ').toLowerCase();
	await context.nosql.get('tracking')
		.push({'userID': context.message.author.id, 'serverID': context.message.guild.id, 'statistic': trackString, 'value': 0})
		.write();
	await context.message.channel.send(`Now tracking \`${trackString}\` for you, ${context.message.author.name}`);
}

const trackUpdate = async (context) => {
	let updateNum = parseInt(context.args.pop());
	let trackString = context.args.join(' ').toLowerCase();
	if (isNaN(updateNum)) {
		return context.message.channel.send("Invalid update value.");
	}
	await context.nosql.get('tracking')
		.find({'userID': context.message.author.id, 'statistic': trackString})
		.assign({'value': updateNum})
		.write();
	await context.message.channel.send(`Updated \`${trackString}\` for you, ${context.message.author.name}`);
}

const listTrackedItems = async (context) => {
	const trackedItems = await context.nosql.get('tracking')
		.find({'userID': context.message.author.id})
		.value();
	let trackEmbed = new Discord.MessageEmbed().setColor('#2295d4').setTitle(`${context.message.author.name}'s tracked items:`);
	trackedItems.forEach(item => {
		trackEmbed.addField(item.statistic, item.value);
	});
	await context.message.channel.send(trackEmbed);
}

const stopTracking = async (context) => {
	let trackString = context.args.join(' ').toLowerCase();
	await context.nosql.get('tracking')
		.remove({'userID': context.message.author.id, 'statistic': trackString})
		.write();
	await context.message.channel.send(`No longer tracking \`${trackString}\` for you, ${context.message.author.name}`);
}

const leaderboard = async (context) => {
	let trackString = context.args.join(' ').toLowerCase();
	let leaderboardItems = await context.nosql.get('tracking')
		.find({'serverID': context.message.guild.id, 'statistic': trackString})
		.value();
	let leaderboardEmbed = new Discord.MessageEmbed().setColor('#2295d4').setTitle(`Leaderboard for ${trackString}`);
	leaderboardItems.forEach(item => {
		let authorName = await client.users.fetch(item.userID).username;
		leaderboardEmbed.addField(authorName, item.value);
	});
	await context.message.channel.send(leaderboardEmbed);
}

module.exports = {
	track,
	trackUpdate,
	listTrackedItems,
	stopTracking,
	leaderboard
}
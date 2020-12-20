const track = async (context) => {
	let trackString = context.args.join(' ').toLowerCase();
	let valueExists = await context.nosql.get('tracking')
		.find({'userID': context.message.author.id, 'statistic': trackString})
		.value();
	if (valueExists) {
		return await context.message.reply("I'm already tracking that for you.");
	}
	await context.nosql.get('tracking')
		.push({'userID': context.message.author.id, 'serverID': context.message.guild.id, 'statistic': trackString, 'value': 0})
		.write();
	await context.message.channel.send(`Now tracking \`${trackString}\` for you, ${context.message.author.username}.`);
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
	await context.message.react('👍');
}

const listTrackedItems = async (context) => {
	const trackedItems = await context.nosql.get('tracking')
		.filter({'userID': context.message.author.id})
		.value();
	if (trackedItems.length) {
		let trackEmbed = new Discord.MessageEmbed().setColor('#2295d4').setTitle(`${context.message.author.username}'s tracked items:`);
		trackedItems.forEach(item => {
			trackEmbed.addField(item.statistic, item.value);
		});
		await context.message.channel.send(trackEmbed);
	}
	else {
		await context.message.channel.send("No tracked items found.");
	}
}

const stopTracking = async (context) => {
	let trackString = context.args.join(' ').toLowerCase();
	await context.nosql.get('tracking')
		.remove({'userID': context.message.author.id, 'statistic': trackString})
		.write();
	await context.message.channel.send(`No longer tracking \`${trackString}\` for you, ${context.message.author.username}.`);
}

const leaderboard = async (context) => {
	let trackString = context.args.join(' ').toLowerCase();
	const leaderboardItems = await context.nosql.get('tracking')
		.filter({'serverID': context.message.guild.id, 'statistic': trackString})
		.value();
	if (leaderboardItems.length) {
		let leaderboardEmbed = new Discord.MessageEmbed().setColor('#2295d4').setTitle(`Leaderboard for ${trackString}`);
		await leaderboardItems.forEach(async item => {
			let user = await client.users.cache.get(item.userID);
			leaderboardEmbed.addField(user.username, item.value);
		});
		await context.message.channel.send(leaderboardEmbed);
	}
	else {
		await context.message.channel.send("Nobody is tracking that statistic here.");
	}
}

module.exports = {
	track,
	trackUpdate,
	listTrackedItems,
	stopTracking,
	leaderboard
}
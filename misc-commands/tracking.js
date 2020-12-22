const track = async (context) => {
	let trackString = context.args.join(' ').toLowerCase();
	let valueExists = await context.nosql.get('tracking')
		.find({'userID': context.message.author.id, 'statistic': trackString})
		.value();
	if (valueExists) {
		return await context.message.reply("I'm already tracking that for you.");
	}
	await context.nosql.get('tracking')
		.push({'userID': context.message.author.id, 'statistic': trackString, 'value': 0})
		.write();
	await context.message.channel.send(`Now tracking \`${trackString}\` for you, ${context.message.author.username}.`);
}

const trackUpdate = async (context) => {
	let updateNum = parseInt(context.args.pop());
	let trackString = context.args.join(' ').toLowerCase();
	if (isNaN(updateNum)) {
		return context.message.channel.send("Invalid update value.");
	}
	else if (updateNum > 1000) {
		return context.message.channel.send("That's a little much, don't you think?");
	}
	let stat = await context.nosql.get('tracking')
		.find({'userID': context.message.author.id, 'statistic': trackString});
	
	if (!stat.value()) {
		return context.message.channel.send("I'm not tracking that for you right now.");
	}
	updateNum += stat.value().value;
	stat.assign({'value': updateNum})
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
		.filter({'statistic': trackString})
		.value();
	await Promise.all(leaderboardItems.map(async item => await context.message.guild.members.fetch(item.userID).then(u => item.username = u.user.username)))
		.then(items => items.filter(item => item.user !== undefined));
	if (leaderboardItems.length) {
		let leaderboardEmbed = new Discord.MessageEmbed().setColor('#2295d4').setTitle(`Leaderboard for ${trackString}`);
		leaderboardItems.sort((a, b) => b.value - a.value).forEach(item => leaderboardEmbed.addField(item?.username, item.value));
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
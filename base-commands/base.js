const { exec } = require('child_process');
const sqlite = require("../database/sqlite");
const nosql = require("../database/nosql")
const {getConfig} = require('../utils')

const complete = (context) => {
	let args = context.args;
	let roles = args.join(' ').split(',').map(x => x.trim());
	if (roles.length > 1) {
		removeRoles(context).then(() => {
			roles = roles.map(role => role + ' complete,');
			roles[roles.length - 1] = roles[roles.length - 1].slice(0, -1);
			//methinks there might be some issues here
			roles = roles.join(' ').split(' '); // is this even necessary
			context.args = roles; // I think this is the necessary fix
			addRoles(context);
		})
		.catch((err) => {
			sendError(context, err);
		});
	}
	else {
		removeRole(context).then(() => {
			args.push('complete');
			addRole(context);
		})
		.catch((err) => {
			sendError(context, err);
		});
	}
}

const addRole = async (context) => {
	let receivedMessage = context.message;
	let role = context.args;
	if (!role.length) {
		return receivedMessage.channel.send('I need a role to try to add!');
	}
	role = role.join(' ');  //For roles with multiple words

	const zeRole = receivedMessage.guild.roles.cache.find(zeRole => zeRole.name.toLowerCase() === role.toLowerCase());

	if(!zeRole) {
		return receivedMessage.channel.send(`${receivedMessage.author}, the ${role} role doesn't seem to exist.  Make sure you spelled it right.`);
	}

	if (role === '@everyone') {
		return receivedMessage.channel.send('Foolish mortal, you cannot add that role!');
	}

	let botHighestRole = receivedMessage.guild.me.roles.highest;
	if (botHighestRole.comparePositionTo(zeRole) <= 0) {
		return receivedMessage.channel.send(`I'm sorry ${receivedMessage.author}, I'm afraid I can't do that.`);
	}

	if (receivedMessage.member.roles.cache.has(zeRole.id)) {
		return receivedMessage.channel.send(`${receivedMessage.author}, you already have the "${zeRole.name}" role!`);
	} else {
		return receivedMessage.member.roles.add(zeRole).then(() => {
			receivedMessage.channel.send(`${receivedMessage.author}, you have been given the "${zeRole.name}" role.`).catch((err) => {
				sendError(context, err);
			});
		}).catch(() => {
			receivedMessage.channel.send('Failed to add the role.');
		});
	}
}

const addRoles = async (context) => {
	let receivedMessage = context.message;
	let roles = context.args;
	if (!roles.length) {
		receivedMessage.channel.send('I need some roles to try to add!');
		return;
	}
	roles = roles.join(' ');  //For roles with multiple words
	roles = roles.split(', ');
	if (roles.includes('@everyone')) {
		receivedMessage.channel.send('Foolish mortal, you cannot add the @everyone role! No roles were added because of your insolence!');
		return;
	}

	const zeRoles = [];
	let previousRoles = [];
	let nonExistentRoles = [];

	for (let i = 0; i < roles.length; ++i) {
		const role = receivedMessage.guild.roles.cache.find(zeRole => zeRole.name.toLowerCase() === roles[i].toLowerCase());
		let botHighestRole = receivedMessage.guild.me.roles.highest;
		if (role && botHighestRole.comparePositionTo(role) <= 0) {
			return receivedMessage.channel.send(`I'm sorry ${receivedMessage.author}, I'm afraid I can't do that.\n(${roles[i]})`);
		} else if (role && !receivedMessage.member.roles.cache.has(role.id)) {
			zeRoles.push(role);
		} else if (!role) {
			nonExistentRoles.push(roles[i]);
		} else { // already has the role
			previousRoles.push(receivedMessage.member.roles.cache.get(role.id).name);
		}
	}
	return receivedMessage.member.roles.add(zeRoles).then(() => {
		const addedRoles = zeRoles.map(r => r.name);	//This is to keep the bot from pinging everyone with the roles it added
		if (addedRoles.length) {
			let specifics = (previousRoles.length ? "\nYou already have these roles: " + previousRoles.join(', ') : '') + 
				(nonExistentRoles.length ? "\nThese roles don't seem to exist: " + nonExistentRoles.join(', ') + "\nMake sure the spelling is correct." : '');
			receivedMessage.channel.send(`${receivedMessage.author}, the following roles have been added: ${addedRoles.join(', ') + specifics}`);
		}
		else {
			receivedMessage.channel.send(`${receivedMessage.author}, you either already have all of those roles or they don't exist!`);
		}
	}).catch(() => {
		receivedMessage.channel.send('There was an error adding the roles.');
	});
}

const removeRole = async (context) => {
	let receivedMessage = context.message;
	let role = context.args;
	if (!role.length) {
		return receivedMessage.channel.send('I need a role to try to remove!');
	}
	role = role.join(' ');  //For roles with multiple words

	const zeRole = receivedMessage.guild.roles.cache.find(zeRole => zeRole.name.toLowerCase() === role.toLowerCase());

	if(!zeRole) {
		return receivedMessage.channel.send(`${receivedMessage.author}, the ${role} role doesn't seem to exist.  Make sure you spelled it right.`);
	}

	if (role === '@everyone') {
		return receivedMessage.channel.send('Foolish mortal, you cannot remove that role!');
	}

	if (receivedMessage.member.roles.cache.has(zeRole.id)) {
		return await receivedMessage.member.roles.remove(zeRole).then(() => {
			receivedMessage.channel.send(`${receivedMessage.author}, I've removed the "${zeRole.name}" role from you.`).catch((err) => {
				sendError(context, err);
			});
		}).catch(() => {
			receivedMessage.channel.send('Failed to remove the role.');
		});
	} else {
		return receivedMessage.channel.send(`${receivedMessage.author}, you don't have the "${zeRole.name}" role!`);
	}
}

const removeRoles = async (context) => {
	let receivedMessage = context.message;
	let roles = context.args;
	if (!roles.length) {
		return receivedMessage.channel.send('I need some roles to try to remove!');
	}
	roles = roles.join(' ');  //For roles with multiple words
	roles = roles.split(', ');
	if (roles.includes('@everyone')) {
		return receivedMessage.channel.send('Foolish mortal, you cannot remove the @everyone role! No roles have been removed because of your insolence!');
	}

	const zeRoles = [];
	let nonRemovedRoles = [];
	let nonExistentRoles = [];

	for (let i = 0; i < roles.length; ++i) {
		const role = receivedMessage.guild.roles.cache.find(zeRole => zeRole.name.toLowerCase() === roles[i].toLowerCase());

		let botHighestRole = receivedMessage.guild.me.roles.highest;
		if (role && botHighestRole.comparePositionTo(role) <= 0) {
			receivedMessage.channel.send(`I'm sorry ${receivedMessage.author}, I'm afraid I can't do that.\n(${roles[i]})`);
		} else if (role && receivedMessage.member.roles.cache.has(role.id)) {
			zeRoles.push(role);
		} else if (!role) {
			nonExistentRoles.push(roles[i]);
		} else {
			nonRemovedRoles.push(receivedMessage.channel.guild.roles.cache.get(role.id).name);
		}
	}
	await receivedMessage.member.roles.remove(zeRoles).then(() => {
		const removedRoles = [];	//This is to keep the bot from pinging everyone with the roles it added
		for (let i = 0; i < zeRoles.length; ++i) {
			removedRoles.push(zeRoles[i].name);
		}
		let specifics = (nonRemovedRoles.length ? "\nYou don't have have these roles: " + nonRemovedRoles.join(', ') : '') +
			(nonExistentRoles.length ? "\nThese roles don't seem to exist: " + nonExistentRoles.join(', ') + "\nMake sure the spelling is correct." : '');
		if (removedRoles.length) {
			return receivedMessage.channel.send(`${receivedMessage.author}, the following roles have been removed: ${removedRoles.join(', ') + specifics}`);
		}
		else {
			let message = specifics || "How did you even get to this condition?";
			if (message === 'How did you even get to this condition?') {
				sendError(context, "Something got real messed up somehow. Hopefully the error can be determined by looking at the above message.");
			}
			return receivedMessage.channel.send(message);
		}
	}).catch(() => {
		receivedMessage.channel.send('There was an error removing the roles.');
	});
}

const info = (context) => {
	let receivedMessage = context.message;
	let channel = context.args;
	const mentionedChannel = receivedMessage.mentions.channels.first()
	if (!channel || !mentionedChannel) {
		receivedMessage.channel.send('I can\'t give information about nothing!');
		return;
	}

	if (mentionedChannel) {
		receivedMessage.channel.send(`${mentionedChannel.name}: ${mentionedChannel.topic}`).catch((err) => {
			sendError(context, err);
		});
	}
	else {
		channel = channel.join();

		const zeChannel = receivedMessage.guild.channels.cache.find(zeChannel => zeChannel.name === channel );
		if (!zeChannel) {
			receivedMessage.channel.send('Channel not found. You must type the channel name exactly as it appears in the list, including dashes.');
			return;
		}
		if (zeChannel.type === 'text') {
			receivedMessage.channel.send(`${zeChannel.name}: ${zeChannel.topic}`).catch((err) => {
				sendError(context, err);
			});
		}
		else {
			receivedMessage.channel.send('Invalid channel type.');
		}
	}
}

const help = (context) => {
	let receivedMessage = context.message;
	let allCommands = require('./help.json');

	let helpEmbed = new Discord.MessageEmbed().setColor('#2295d4');
	Object.keys(allCommands).forEach(command => {
		const currentCommand = allCommands[command];
		helpEmbed.addField(currentCommand.title, currentCommand.description);
	});
	receivedMessage.channel.send(helpEmbed);
}

const roles = (context) => {
	let receivedMessage = context.message;
	let botHighestRole = receivedMessage.guild.me.roles.highest;
	let roleEmbed = new Discord.MessageEmbed().setColor('#2295d4');
	let eligibleRoles = [];
	for (const [snowflake, role] of receivedMessage.guild.roles.cache) {
		if (botHighestRole.comparePositionTo(role) > 0 && role.name !== '@everyone' && role.editable && role.name.indexOf('complete') === -1) {
			eligibleRoles.push(role.name);
		}
	}
	eligibleRoles.sort();
	roleEmbed.setTitle('Available Role(s):');
	roleEmbed.setDescription(eligibleRoles.join(', '));
	if (receivedMessage.guild.name === 'BYU CS') {
		roleEmbed.setFooter('Remember, there is also a "complete" variant of every class role!');
	}
	receivedMessage.channel.send(roleEmbed);
}

const gitPull = (context) => {
	const config = getConfig(context.message.guild.id, context.nosql)

	let receivedMessage = context.message;
	if (!config.administrators.includes(receivedMessage.author.id)) {
		return;
	}
	receivedMessage.react('👍');
	exec(`git pull && npm install && npm run restart || curl -H "Content-Type: application/json" -X POST -d '{"username": "Kaiser-Updater", "content": "Automatic update failed. Manual intervention required."}' https://discordapp.com/api/webhooks/729058198417440870/j4M63rmD8G233Dz09WdWX8UeoZmQRC3QRs_HV5f6MQe-gWE0CeZ0Wkb-XFsBNQ_UFsto`,
		async (error, stdout, stderr) => {
			if (error) {
				return sendError(context, error);
			}
		});
}

const sendError = (context, err) => {
	const receivedMessage = context.message;
	const config = getConfig(context.message.guild.id, context.nosql)

	console.error(err);
	let errorEmbed = new Discord.MessageEmbed().setColor('#bf260b');
	errorEmbed.setTitle('Glitch in the Matrix');
	if (receivedMessage) {
		errorEmbed.addField('Message:', receivedMessage.content);
		errorEmbed.addField('Guilty User:', receivedMessage.author);
		errorEmbed.addField('Channel:', receivedMessage.channel);
		if (receivedMessage.guild) {
			errorEmbed.addField('Server/Guild:', receivedMessage.guild);
		}
	}
	errorEmbed.addField('Error:', err.stack || err);
	config.administrators.forEach(userID => {
		client.users.fetch(userID).then((user) => {
			user.send(errorEmbed);
		});
	});
}

const banish = async (context) => {
	let receivedMessage = context.message;
	let db = context.db;
	const config = getConfig(context.message.guild.id, context.nosql)

	// only admins can banish
	if (!config.administrators.includes(receivedMessage.author.id)) {
		receivedMessage.channel.send(receivedMessage.author, {
			files: ['./misc-files/no-power.gif']
		});
		return;
	}
	const whoToBanish = receivedMessage.mentions.users;

	if (whoToBanish.size === 0) {
		await receivedMessage.react("🇼");
		await receivedMessage.react("🇭");
		await receivedMessage.react("🇴");
		await receivedMessage.react("❓");
		return;
	}

	// can't banish admins or Ze Kaiser
	if (whoToBanish.has(receivedMessage.client.user.id)) {
		receivedMessage.channel.send("You fool. I am invincible!");
		return;
	}

	if (config.administrators.some(admin => whoToBanish.has(admin))) {
		receivedMessage.channel.send("That user would kill me if I smote them, so no.");
		return;
	}

	const banishmentsPerChannel = await sqlite.getChannelsAndBanishments(db);
	const currentBanishments = banishmentsPerChannel.get(receivedMessage.channel.id);
	// no double banishing
	if (currentBanishments) {
		for (const banishedUserId of currentBanishments) {
			whoToBanish.delete(banishedUserId);
		}

		if (whoToBanish.size === 0) {
			receivedMessage.channel.send("All those users have already been banished. Why do you wish to punish them further?");
			return;
		}
	}

	receivedMessage.delete();

	const channelId = receivedMessage.channel.id;
	const names = Array.from(whoToBanish.values()).map(u => u.tag);
	const ids = Array.from(whoToBanish.keys());
	console.log(`Banishing ${names.join(", ")} from channel #${receivedMessage.channel.name}`);
	if (context.primaryCommand !== "shadowban") {
		receivedMessage.channel.send("Begone " + Array.from(whoToBanish.values()).join(" "));
	}
	
	await sqlite.banish(db, ids, channelId);
	
	return await sqlite.getChannelsAndBanishments(db);
}

const unbanish = async (context) => {
	let receivedMessage = context.message;
	let db = context.db;
	const config = getConfig(context.message.guild.id, context.nosql)

	if (!config.administrators.includes(receivedMessage.author.id)) {
		await receivedMessage.channel.send(receivedMessage.author, {
			files: ['./misc-files/no-power.gif']
		});
		return;
	}

	const whoToUnbanish = receivedMessage.mentions.users;

	if (whoToUnbanish.size === 0) {
		await receivedMessage.react("🇼");
		await receivedMessage.react("🇭");
		await receivedMessage.react("🇴");
		await receivedMessage.react("❓");
		return;
	}
	
	const channelId = receivedMessage.channel.id;
	const ids = Array.from(whoToUnbanish.keys());

	await sqlite.unbanish(db, ids, channelId);
	
	receivedMessage.channel.send("You may return, " + Array.from(whoToUnbanish.values()).join(" "));
}

const viewConfig = async(context) => {
	const config = getConfig(context.message.guild.id, context.nosql)

	let receivedMessage = context.message;

	if (!config.administrators.includes(receivedMessage.author.id)) {
		await receivedMessage.channel.send(receivedMessage.author, {
			files: ['./misc-files/no-power.gif']
		});
		return;
	}

	receivedMessage.channel.send(JSON.stringify(config, null, 4));
}

module.exports = {
	complete,
	addRole,
	addRoles,
	removeRole,
	removeRoles,
	info,
	help,
	roles,
	gitPull,
	sendError,
	banish,
	unbanish,
	viewConfig,
};

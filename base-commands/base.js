const config = require('../config.json');
const { exec } = require('child_process');

const complete = (receivedMessage, args) => {
	let roles = args.join(' ').split(',').map(x => x.trim());
	if (roles.length > 1) {
		removeRoles(receivedMessage, args).then(() => {
			roles = roles.map(role => role + ' complete,');
			roles[roles.length - 1] = roles[roles.length - 1].slice(0, -1);
			roles = roles.join(' ').split(' ');
			addRoles(receivedMessage, roles);
		})
		.catch((err) => {
			sendError(receivedMessage, err);
		});
	}
	else {
		removeRole(receivedMessage, args).then(() => {
			args.push('complete');
			addRole(receivedMessage, args);
		})
		.catch((err) => {
			sendError(receivedMessage, err);
		});
	}
}

const addRole = (receivedMessage, role) => {
	if (!role.length) {
		receivedMessage.channel.send('I need a role to try to add!');
		return;
	}
	role = role.join(' ');  //For roles with multiple words

	const zeRole = receivedMessage.guild.roles.cache.find(zeRole => zeRole.name.toLowerCase() === role.toLowerCase());

	if(!zeRole) {
		receivedMessage.channel.send(`${receivedMessage.author}, the ${role} role doesn't seem to exist.  Make sure you spelled it right.`);
		return;
	}

	if (role == '@everyone') {
		receivedMessage.channel.send('Foolish mortal, you cannot add that role!');
		return;
	}

	let botHighestRole = receivedMessage.guild.me.roles.highest;
	if (botHighestRole.comparePositionTo(zeRole) <= 0) {
		receivedMessage.channel.send(`I'm sorry ${receivedMessage.author}, I'm afraid I can't do that.`);
		return;
	}

	if (receivedMessage.member.roles.cache.has(zeRole.id)) {
		return receivedMessage.channel.send(`${receivedMessage.author}, you already have the "${zeRole.name}" role!`);
	} else {
		return receivedMessage.member.roles.add(zeRole).then(() => {
			receivedMessage.channel.send(`${receivedMessage.author}, you have been given the "${zeRole.name}" role.`).catch((err) => {
				sendError(receivedMessage, err);
			});
		}).catch((err) => {
			receivedMessage.channel.send('Failed to add the role.');
		});
	}
}

const addRoles = (receivedMessage, roles) => {
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
			receivedMessage.channel.send(`I'm sorry ${receivedMessage.author}, I'm afraid I can't do that.\n(${roles[i]})`);
		} else if (role && !receivedMessage.member.roles.cache.has(role.id)) {
			zeRoles.push(role);
		} else if (!role) {
			nonExistentRoles.push(roles[i]);
		} else { // already has the role
			previousRoles.push(receivedMessage.member.roles.cache.get(role.id).name);
		}
	}
	return receivedMessage.member.roles.add(zeRoles).then(() => {
		const addedRoles = [];	//This is to keep the bot from pinging everyone with the roles it added
		for (let i = 0; i < zeRoles.length; ++i) {
			if (receivedMessage.member.roles.cache.has(zeRoles[i].id)) {
				addedRoles.push(zeRoles[i].name);
			}
		}
		if (addedRoles.length) {
			let specifics = (previousRoles.length ? "\nYou already have these roles: " + previousRoles.join(', ') : '') + 
				(nonExistentRoles.length ? "\nThese roles don't seem to exist: " + nonExistentRoles.join(', ') + "\nMake sure the spelling is correct." : '');
			receivedMessage.channel.send(`${receivedMessage.author}, the following roles have been added: ${addedRoles.join(', ') + specifics}`);
		}
		else {
			receivedMessage.channel.send(`${receivedMessage.author}, you either already have all of those roles or they don't exist!`);
		}
	}).catch((err) => {
		receivedMessage.channel.send('There was an error adding the roles.');
	});
}

const removeRole = (receivedMessage, role) => {
	if (!role.length) {
		receivedMessage.channel.send('I need a role to try to remove!');
		return;
	}
	role = role.join(' ');  //For roles with multiple words

	const zeRole = receivedMessage.guild.roles.cache.find(zeRole => zeRole.name.toLowerCase() === role.toLowerCase());

	if(!zeRole) {
		receivedMessage.channel.send(`${receivedMessage.author}, the ${role} role doesn't seem to exist.  Make sure you spelled it right.`);
		return;
	}

	if (role == '@everyone') {
		receivedMessage.channel.send('Foolish mortal, you cannot remove that role!');
		return;
	}

	if (receivedMessage.member.roles.cache.has(zeRole.id)) {
		return receivedMessage.member.roles.remove(zeRole).then(() => {
			receivedMessage.channel.send(`${receivedMessage.author}, I've removed the "${zeRole.name}" role from you.`).catch((err) => {
				sendError(receivedMessage, err);
			});
		}).catch((err) => {
			receivedMessage.channel.send('Failed to remove the role.');
		});
	} else {
		return receivedMessage.channel.send(`${receivedMessage.author}, you don't have the "${zeRole.name}" role!`);
	}
}

const removeRoles = (receivedMessage, roles) => {
	if (!roles.length) {
		receivedMessage.channel.send('I need some roles to try to remove!');
		return;
	}
	roles = roles.join(' ');  //For roles with multiple words
	roles = roles.split(', ');
	if (roles.includes('@everyone')) {
		receivedMessage.channel.send('Foolish mortal, you cannot remove the @everyone role! No roles have been removed because of your insolence!');
		return;
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
	return receivedMessage.member.roles.remove(zeRoles).then(() => {
		const removedRoles = [];	//This is to keep the bot from pinging everyone with the roles it added
		for (let i = 0; i < zeRoles.length; ++i) {
			removedRoles.push(zeRoles[i].name);
		}
		let specifics = (nonRemovedRoles.length ? "\nYou don't have have these roles: " + nonRemovedRoles.join(', ') : '') +
			(nonExistentRoles.length ? "\nThese roles don't seem to exist: " + nonExistentRoles.join(', ') + "\nMake sure the spelling is correct." : '');
		if (removedRoles.length) {
			receivedMessage.channel.send(`${receivedMessage.author}, the following roles have been removed: ${removedRoles.join(', ') + specifics}`);
		}
		else {
			let message = specifics || "How did you even get to this condition?";
			receivedMessage.channel.send(message);
			if (message === 'How did you even get to this condition?') {
				sendError(receivedMessage, "Something got real messed up somehow. Hopefully the error can be determined by looking at the above message.")
			}
		}
	}).catch((err) => {
		receivedMessage.channel.send('There was an error removing the roles.');
	});
}

const info = (receivedMessage, channel) => {
	if (!channel) {
		receivedMessage.channel.send('I can\'t give information about nothing!');
		return;
	}
	channel = channel.join();

	const zeChannel = receivedMessage.guild.channels.cache.find(zeChannel => zeChannel.name === channel );
	if (!zeChannel) {
		receivedMessage.channel.send('Channel not found. You must type the channel name exactly as it appears in the list, including dashes.');
		return;
	}
	if (zeChannel.type == 'text') {
		receivedMessage.channel.send(`${zeChannel.name}: ${zeChannel.topic}`).catch((err) => {
			sendError(receivedMessage, err);
		});
	}
	else {
		receivedMessage.channel.send('Invalid channel type.');
	}
}

const help = (receivedMessage) => {
	let allCommands = require('./help.json');

	const helpEmbed = new Discord.MessageEmbed().setColor('#2295d4');
	Object.keys(allCommands).forEach(command => {
		const currentCommand = allCommands[command];
		helpEmbed.addField(currentCommand.title, currentCommand.description);
	});
	receivedMessage.channel.send(helpEmbed);
}

const roles = (receivedMessage) => {
	let botHighestRole = receivedMessage.guild.me.roles.highest;
	const roleEmbed = new Discord.MessageEmbed().setColor('#2295d4');
	const eligibleRoles = [];
	for (const [snowflake, role] of receivedMessage.guild.roles.cache) {
		if (botHighestRole.comparePositionTo(role) > 0 && role.name != '@everyone' && role.editable && role.name.indexOf('complete') == -1) {
			eligibleRoles.push(role.name);
		}
	};
	eligibleRoles.sort();
	roleEmbed.setTitle('Available Role(s):');
	roleEmbed.setDescription(eligibleRoles.join(', '));
	if (receivedMessage.guild.name == 'BYU CS') {
		roleEmbed.setFooter('Remember, there is also a "complete" variant of every class role!');
	}
	receivedMessage.channel.send(roleEmbed);
}

const gitPull = (receivedMessage) => {
	exec(`git pull && pm2 restart kaiser || curl -H "Content-Type: application/json" -X POST -d '{"username": "Kaiser-Updater", "content": "Automatic update failed. Manual intervention required."}' https://discordapp.com/api/webhooks/729058198417440870/j4M63rmD8G233Dz09WdWX8UeoZmQRC3QRs_HV5f6MQe-gWE0CeZ0Wkb-XFsBNQ_UFsto`,
		async (error, stdout, stderr) => {
			if (error) {
				sendError(receivedMessage, error);
			}
		});
}

const sendError = (receivedMessage, err) => {
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
	sendError
};

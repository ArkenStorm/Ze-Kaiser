const config = require('../config.json');

const addRole = (receivedMessage, role) => {
	if (!role.length) {
		receivedMessage.channel.send('I need a role to try to add!');
		return;
	}
	role = role.join(' ');  //For roles with multiple words

	const zeRole = receivedMessage.guild.roles.find(zeRole => zeRole.name === role);

	if(!zeRole) {
		receivedMessage.channel.send(`${receivedMessage.author}, the ${role} role doesn't seem to exist.  Make sure you spelled it right.  I am case-sensitive, so make sure the casing matches, too.`);
		return;
	}

	if (role == '@everyone') {
		receivedMessage.channel.send('Foolish mortal, you cannot add that role!');
		return;
	}

	let botHighestRole = receivedMessage.guild.me.highestRole;
	if (botHighestRole.comparePositionTo(zeRole) <= 0) {
		receivedMessage.channel.send(`I'm sorry ${receivedMessage.author}, I'm afraid I can't do that.`);
		return;
	}

	if (receivedMessage.member.roles.has(zeRole.id)) {
		receivedMessage.channel.send(`${receivedMessage.author}, you already have the "${role}" role!`);
	} else {
		receivedMessage.member.addRole(zeRole).then(() => {
			receivedMessage.channel.send(`${receivedMessage.author}, you have been given the "${role}" role.`).catch((err) => {
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

    for (let i = 0; i < roles.length; ++i) {
		const role = receivedMessage.guild.roles.find(zeRole => zeRole.name === roles[i]);
		let botHighestRole = receivedMessage.guild.me.highestRole;
		if (role && botHighestRole.comparePositionTo(role) <= 0) {
			receivedMessage.channel.send(`I'm sorry ${receivedMessage.author}, I'm afraid I can't do that.\n(${roles[i]})`);
		} else if (role && !receivedMessage.member.roles.has(role.id)) {
            zeRoles.push(role);
        } else if (!role) {
            receivedMessage.channel.send(`The ${roles[i]} role doesn't seem to exist.  Make sure the spelling and casing are both correct.`);
        } else {
            receivedMessage.channel.send(`${receivedMessage.author}, you already have the "${roles[i]}" role!`)
        }
    }
    receivedMessage.member.addRoles(zeRoles).then(() => {
		const addedRoles = [];	//This is to keep the bot from pinging everyone with the roles it added
		for (let i = 0; i < zeRoles.length; ++i) {
			if (receivedMessage.member.roles.has(zeRoles[i].id)) {
				addedRoles.push(zeRoles[i].name);
			}
		}
		if (addedRoles.length) {
			receivedMessage.channel.send(`${receivedMessage.author}, the following roles have been added: ${addedRoles.join(', ')}`);
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

	const zeRole = receivedMessage.guild.roles.find(zeRole => zeRole.name === role);

	if(!zeRole) {
		receivedMessage.channel.send(`${receivedMessage.author}, the ${role} role doesn't seem to exist.  Make sure you spelled it right.  I am case-sensitive, so make sure the casing matches, too.`);
		return;
	}

	if (role == '@everyone') {
		receivedMessage.channel.send('Foolish mortal, you cannot remove that role!');
		return;
	}

	if (receivedMessage.member.roles.has(zeRole.id)) {
		receivedMessage.member.removeRole(zeRole).then(() => {
			receivedMessage.channel.send(`${receivedMessage.author}, I've removed the "${role}" role from you.`).catch((err) => {
				sendError(receivedMessage, err);
			});
		}).catch((err) => {
			receivedMessage.channel.send('Failed to remove the role.');
		});
	} else {
		receivedMessage.channel.send(`${receivedMessage.author}, you don't have the "${role}" role!`);
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

    for (let i = 0; i < roles.length; ++i) {
		const role = receivedMessage.guild.roles.find(zeRole => zeRole.name === roles[i]);

		let botHighestRole = receivedMessage.guild.me.highestRole;
		if (role && botHighestRole.comparePositionTo(role) <= 0) {
			receivedMessage.channel.send(`I'm sorry ${receivedMessage.author}, I'm afraid I can't do that.\n(${roles[i]})`);
		} else if (role && receivedMessage.member.roles.has(role.id)) {
            zeRoles.push(role);
        } else if (!role) {
            receivedMessage.channel.send(`The ${roles[i]} role doesn't seem to exist.  Make sure the spelling and casing are both correct.`);
        } else {
            receivedMessage.channel.send(`${receivedMessage.author}, you don't have the "${roles[i]}" role!`)
        }
    }
    receivedMessage.member.removeRoles(zeRoles).then(() => {
		const removedRoles = [];	//This is to keep the bot from pinging everyone with the roles it added
		for (let i = 0; i < zeRoles.length; ++i) {
			removedRoles.push(zeRoles[i].name);
		}
        receivedMessage.channel.send(`${receivedMessage.author}, the following roles have been removed: ${removedRoles.join(', ')}`);
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

	const zeChannel = receivedMessage.guild.channels.find(zeChannel => zeChannel.name === channel );
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

	const helpEmbed = new Discord.RichEmbed().setColor('#2295d4');
	Object.keys(allCommands).forEach(command => {
		const currentCommand = allCommands[command];
		helpEmbed.addField(currentCommand.title, currentCommand.description);
	});
	receivedMessage.channel.send(helpEmbed);
}

const roles = (receivedMessage) => {
	let botHighestRole = receivedMessage.guild.me.highestRole;
	const roleEmbed = new Discord.RichEmbed().setColor('#2295d4');
	const eligibleRoles = [];
	receivedMessage.guild.roles.forEach(role => {
		if (botHighestRole.comparePositionTo(role) > 0 && role.name != '@everyone' && role.editable && role.name.indexOf('complete') == -1) {
			eligibleRoles.push(role.name);
		}
	});
	eligibleRoles.sort();
	roleEmbed.setTitle('Available Role(s):');
	roleEmbed.setDescription(eligibleRoles.join(', '));
	if (receivedMessage.guild.name == 'BYU CS') {
		roleEmbed.setFooter('Remember, there is also a "complete" variant of every class role!');
	}
	receivedMessage.channel.send(roleEmbed);
}

const sendError = (receivedMessage, err) => {
	console.error(err);
	let errorEmbed = new Discord.RichEmbed().setColor('#bf260b');
	errorEmbed.setTitle('Glitch in the Matrix');
	if (receivedMessage) {
		errorEmbed.addField('Message:', receivedMessage.content);
	}
	errorEmbed.addField('Error:', err.stack || err);
	config.administrators.forEach(userID => {
		client.fetchUser(userID).then((user) => {
			user.send(errorEmbed);
		});
	});
}

module.exports = {
    addRole,
    addRoles,
	removeRole,
	removeRoles,
	info,
	help,
	roles,
	sendError
};

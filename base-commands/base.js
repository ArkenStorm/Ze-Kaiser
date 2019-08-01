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
				client.fetchUser('400191346742263818').then((user) => { //Zealot's ID
					user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
				});
				client.fetchUser('358333674514677760').then((user) => { //Arken's ID
					user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
				});
			});
		}).catch((err) => {
			receivedMessage.channel.send('Failed to add the role.');
		});
	}
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

	if (receivedMessage.member.roles.has(zeRole.id)) {
		receivedMessage.member.removeRole(zeRole).then(() => {
			receivedMessage.channel.send(`${receivedMessage.author}, I've removed the "${role}" role from you.`).catch((err) => {
				client.fetchUser('400191346742263818').then((user) => { //Zealot's ID
					user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
				});
				client.fetchUser('358333674514677760').then((user) => { //Arken's ID
					user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
				});
			});
		}).catch((err) => {
			receivedMessage.channel.send('Failed to remove the role.');
		});
	} else {
		receivedMessage.channel.send(`${receivedMessage.author}, you don't have the "${role}" role!`);
	}
}

module.exports = {
	addRole,
	removeRole
};

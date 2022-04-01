const base = require('../base-commands/base');

// I promise this is for a good cause!
const vulgarity = ['damn', 'shit', 'fuck', 'bitch', 'cunt', 'nigger', 'bastard', 'pussy', 'fakenaughtyword', 'april', 'fool', 'apr', '1st', 'first', 'he🏒🏒', 'ur mom'];

const filter = (context) => {
	const receivedMessage = context.message;
	if (!receivedMessage.guild) {
		return false;
	}
	const modChannel = receivedMessage.guild.channels.cache.find(channel => channel.name == 'mod-logs');
	for (const word of vulgarity) {
		if (receivedMessage.content.indexOf(word) != -1) {
			receivedMessage.delete().catch((err) => {
				base.sendError(context, err);
			});
			receivedMessage.channel.send(`Tsk tsk, ${receivedMessage.author}`, {
				files: ['./misc-files/christian-server.jpg']
			}).catch((err) => {
				base.sendError(context, err);
			});

			let modEmbed = new Discord.MessageEmbed().setColor('#F69400');
			modEmbed.setTitle('Press "Y" to Shame');
			if (receivedMessage) {
				modEmbed.addField('Message:', '||' + receivedMessage.content + '||');
				modEmbed.addField('Guilty User:', receivedMessage.author);
				modEmbed.addField('Channel:', receivedMessage.channel);
				if (receivedMessage.guild) {
					modEmbed.addField('Server/Guild:', receivedMessage.guild);
				}
				modEmbed.addField('Time:', receivedMessage.createdAt)
			}

			if (modChannel) {
				modChannel.send(modEmbed).then(message => {
					message.react('🇾');
				});
			}
			else {
				const config = context.nosql.get('config')
					.find({serverID: context.message.guild.id})
					.value().config
				config.administrators.forEach(userID => {
					client.users.fetch(userID).then((user) => {
						user.send(modEmbed);
					});
				});
			}
			return false;
		}
	}

	return true;
}

module.exports = {
	filter
}

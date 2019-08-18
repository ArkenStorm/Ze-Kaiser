global.Discord = require('discord.js');
global.client = new Discord.Client();
const security = require('./auth.json');

const misc = require('./misc-commands/misc');
const base = require('./base-commands/base');

client.on('ready', () => {
	console.log('Connected as ' + client.user.tag);
});

client.on('message', (receivedMessage) => {
	if (receivedMessage.author === client.user) {   //Make sure the bot doesn't respond to itself, otherwise weird loopage may occur
		return;
	}

	if (receivedMessage.content.startsWith('!')) {
		processCommand(receivedMessage);
	}

	if (receivedMessage.isMentioned(client.user)) {
		const why = client.emojis.get('612697675996856362');
		if (why) {
			receivedMessage.react(why);
		}
	}
});

client.on('messageReactionAdd', (messageReaction) => {
	if (messageReaction.message.author === client.user) {
		return;
	}
	misc.autoReact(messageReaction);
});

const processCommand = (receivedMessage) => {
	let fullCommand = receivedMessage.content.substr(1) // Remove the leading character
	let splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space
	let primaryCommand = splitCommand[0] // The first word directly after the exclamation is the command
	primaryCommand = primaryCommand.toLowerCase();  //make the command lower case to eliminate case sensitivity
	let args = splitCommand.slice(1) // All other words are arguments/parameters/options for the command

	switch(primaryCommand) {
		case 'cooldudes':
			misc.cooldudes(receivedMessage);
			break;
		case 'bamboozled':
			misc.bamboozled(receivedMessage);
			break;
		case 'illegal':
			misc.illegal(receivedMessage);
			break;
		case 'addrole':
			base.addRole(receivedMessage, args);
			break;
		case 'removerole':
			base.removeRole(receivedMessage, args);
			break;
		case 'addroles':
			base.addRoles(receivedMessage, args);
			break;
		case 'removeroles':
			base.removeRoles(receivedMessage, args);
			break;
		case 'info':
			base.info(receivedMessage, args);
			break;
		case 'help':
			base.help(receivedMessage);
			break;
		default:
			receivedMessage.channel.send('Invalid command.');
	}
}

bot_secret_token = security.token;

client.login(bot_secret_token);
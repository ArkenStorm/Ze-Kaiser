global.Discord = require('discord.js');
global.client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION']});
const security = require('./auth.json');

const misc = require('./misc-commands/misc');
const base = require('./base-commands/base');
const starboard = require('./misc-commands/starboard');
const hangman = require('./misc-commands/hangman');
const config = require('./config.json');
const filter = require('./utility-commands/chat-filter');
const sqlite = require('./database/sqlite');

var messageBeingProcessed;

sqlite.startDatabase("./db.sqlite").then((dbConnection) => {
	client.on('ready', () => {
		console.log('Connected as ' + client.user.tag);
	});
	
	client.on('error', () => {
		// Oh no, let's try restarting
		console.error('Encountered an error establishing a connection to Discord, restarting...');
		setTimeout(() => process.exit(1), 10000);
	})
	
	setInterval(() => {
		if (global.client.user === null || global.client.status == 5) {
			console.error('WATCHDOG: Discord User is not active, attempting restart...');
			setTimeout(() => process.exit(1), 10000);
		}
	}, 10000);
	
	client.on('message', (receivedMessage) => {
		if (receivedMessage.author !== client.user && !filter.filter(receivedMessage)) {
			return;
		}
		if (receivedMessage.author === client.user || misc.smited.has(receivedMessage.author)) {   //Make sure the bot doesn't respond to itself, otherwise weird loopage may occur
			return;
		}
	
		if (receivedMessage.guild === null) {
			return;
		}
	
		if (receivedMessage.content.startsWith('!')) {
			messageBeingProcessed = receivedMessage;
			processCommand(receivedMessage);
		}
		else if (receivedMessage.mentions.has(client.user)) {
			const why = client.emojis.cache.get('612697675996856362');
			if (why && !receivedMessage.deleted) {
				receivedMessage.react(why);
			}
		}
	});
	
	client.on('messageReactionAdd', async (reaction, user) => {
		if (reaction.partial) {
			try {
				await reaction.fetch();
			}
			catch (error) {
				errorMessage = {content: 'Something went wrong when fetching the message!', author: user, channel: reaction.message.channel};
				base.sendError(errorMessage, error);
				return;
			}
		}
		if (reaction.message.guild === null || misc.smited.has(reaction.message.author)) {
			return;
		}
	
		misc.autoReact(reaction);
		starboard.add(reaction, user);
	});
	
	client.on('messageReactionRemove', async (reaction, user) => {
		if (reaction.partial) {
			try {
				await reaction.fetch();
			}
			catch (error) {
				errorMessage = {content: 'Something went wrong when fetching the message!', author: user, channel: reaction.message.channel};
				base.sendError(errorMessage, error);
				return;
			}
		}
		if (reaction.message.guild === null) {
			return;
		}
	
		starboard.subtract(reaction, user);
	});
	
	const processCommand = (receivedMessage) => {
		try {
			let fullCommand = receivedMessage.content.substr(1) // Remove the leading character
			let splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space
			let primaryCommand = splitCommand[0] // The first word directly after the exclamation is the command
			primaryCommand = primaryCommand.toLowerCase();  //make the command lower case to eliminate case sensitivity
			let args = splitCommand.slice(1) // All other words are arguments/parameters/options for the command
	
			if (misc.ignoredChannels.has(receivedMessage.channel) && primaryCommand !== 'startlistening') {
				return;
			}
	
			switch(primaryCommand) {
				case 'cooldudes':
				case 'bamboozled':
				case 'illegal':
				case 'ontopic':
				case 'bigbean':
				case 'bigbrain':
				case 'kronk':
				case 'comingtogether':
				case 'dewit':
				case 'doit':
				case 'thoughtpolice':
				case 'enjoythings':
				case 'gasp':
				case 'whoknew':
				case 'patience':
				case 'whomst':
				case 'itsatrap':
				case 'facepalm':
				case 'ironic':
					misc.meme(receivedMessage, primaryCommand, args.join(' '));
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
				case 'complete':
					base.complete(receivedMessage, args);
					break;
				case 'info':
					base.info(receivedMessage, args);
					break;
				case 'help':
					base.help(receivedMessage);
					break;
				case 'roles':
					base.roles(receivedMessage);
					break;
				case 'smite':
					misc.smite(receivedMessage);
					break;
				case 'unsmite':
					misc.unsmite(receivedMessage);
					break;
				case 'tothegallows':
					hangman.hangman(receivedMessage, args);
					break;
				case 'guess':
					hangman.guess(receivedMessage, args);
					break;
				case 'hset':
					hangman.hset(receivedMessage);
					break;
				case 'avatar':
					misc.avatar(receivedMessage);
					break;
				case 'buhgok':
				case 'warning':
					misc.warning(receivedMessage);
					break;
				case 'makegif':
					misc.vidtogif(receivedMessage);
					break;
				case 'startlistening':
					misc.startListening(receivedMessage);
					break;
				case 'stoplistening':
					misc.stopListening(receivedMessage, args);
					break;
				case 'pull':
				case 'gitpull':
					base.gitPull(receivedMessage);
					break;
				default:
					receivedMessage.channel.send('Invalid command.');
			}
		} catch (err) {
			base.sendError(receivedMessage, err);
		}
	}
	
	bot_secret_token = security.token;
	
	client.login(bot_secret_token);
});

// LAST DITCH ERROR HANDLING; Is technically deprecated, care for future
process.on("unhandledRejection", (err) => {
	base.sendError(messageBeingProcessed, err);
	messageBeingProcessed = undefined;
});
process.on("uncaughtException", (err) => {
	base.sendError(messageBeingProcessed, err);
	messageBeingProcessed = undefined;
});

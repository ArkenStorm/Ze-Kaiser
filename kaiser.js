global.Discord = require('discord.js');
global.client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION']});
const security = require('./auth.json');

const misc = require('./misc-commands/misc');
const base = require('./base-commands/base');
const starboard = require('./misc-commands/starboard');
const tag = require('./misc-commands/tag')
const filter = require('./utility-commands/chat-filter');
const sqlite = require('./database/sqlite');
const nosql = require('./database/nosql')
const baseCommands = require('./commands.js');
const config = require('./base-commands/config');

let messageBeingProcessed;

sqlite.startDatabase("./db.sqlite").then(async (sqliteDB) => {
	nosql.startDatabase("./nosql.json").then(async (nosqlDB) => {
		client.on('ready', () => {
			console.log('Connected as ' + client.user.tag);
			config.init({nosql: nosqlDB, guilds: client.guilds})
		});

		client.on('error', () => {
			// Oh no, let's try restarting
			console.error('Encountered an error establishing a connection to Discord, restarting...');
			setTimeout(() => process.exit(1), 10000);
		})

		setInterval(() => {
			if (global.client.user === null || global.client.status === 5) {
				console.error('WATCHDOG: Discord User is not active, attempting restart...');
				setTimeout(() => process.exit(1), 10000);
			}
		}, 10000);

		client.on('message', async (receivedMessage) => {
			if (receivedMessage.author !== client.user && !filter.filter({message: receivedMessage, nosql: nosqlDB})) {
				return;
			}
			if (receivedMessage.author === client.user || misc.smited.has(receivedMessage.author)) {   //Make sure the bot doesn't respond to itself, otherwise weird loopage may occur
				return;
			}

			if (receivedMessage.guild === null) {
				return;
			}

			const banishmentsPerChannel = await sqlite.getChannelsAndBanishments(sqliteDB);

			if (banishmentsPerChannel.has(receivedMessage.channel.id) &&
					banishmentsPerChannel.get(receivedMessage.channel.id).has(receivedMessage.author.id)) {
				await receivedMessage.delete();
				return;
			}

			if (receivedMessage.content.startsWith('!')) {
				messageBeingProcessed = receivedMessage;
				await processCommand(receivedMessage);
			}
			else if (receivedMessage.mentions.has(client.user)) {
				const why = client.emojis.cache.get('612697675996856362');
				if (why && !receivedMessage.deleted) {
					await receivedMessage.react(why);
				}
			}
		});

		client.on('messageReactionAdd', async (reaction, user) => {
			if (reaction.partial) {
				try {
					await reaction.fetch();
				}
				catch (error) {
					let errorMessage = {
						content: 'Something went wrong when fetching the message!',
						author: user,
						channel: reaction.message.channel
					};
					base.sendError({message: errorMessage, nosql: nosqlDB}, error);
					return;
				}
			}
			if (reaction.message.guild === null || misc.smited.has(reaction.message.author)) {
				return;
			}

			misc.autoReact({
				reaction,
				nosql: nosqlDB
			});
			await starboard.add({
				reaction,
				user,
				nosql: nosqlDB
			});
		});

		client.on('messageReactionRemove', async (reaction, user) => {
			if (reaction.partial) {
				try {
					await reaction.fetch();
				}
				catch (error) {
					let errorMessage = {
						content: 'Something went wrong when fetching the message!',
						author: user,
						channel: reaction.message.channel
					};
					base.sendError({message: errorMessage, nosql: nosqlDB}, error);
					return;
				}
			}
			if (reaction.message.guild === null) {
				return;
			}
			await starboard.subtract({
				reaction,
				user,
				nosql: nosqlDB
			});
		});

		const processCommand = (receivedMessage) => {
			try {
				let fullCommand = receivedMessage.content.substr(1) // Remove the leading character
				let splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space
				let primaryCommand = splitCommand[0] // The first word directly after the exclamation is the command
				primaryCommand = primaryCommand.toLowerCase();  //make the command lower case to eliminate case sensitivity
				let args = splitCommand.slice(1) // All other words are arguments/parameters/options for the command
				let serverid = receivedMessage.guild.id;

				if (misc.ignoredChannels.has(receivedMessage.channel) && primaryCommand !== 'startlistening') {
					return;
				}

				let context = {
					message: receivedMessage,
					args,
					primaryCommand,
					db: sqliteDB,
					nosql: nosqlDB,
				}

				const foundTag = nosqlDB.get('tags').find({"serverID": serverid, "tag": primaryCommand}).value()

				if (baseCommands[primaryCommand]) {
					baseCommands[primaryCommand](context);
				} else if (foundTag) {
					tag.showTag(context)
				}
				else {
					receivedMessage.channel.send('Invalid command.');
				}
			} catch (err) {
				base.sendError({message: receivedMessage, nosql: nosqlDB}, err);
			}
		}

		// LAST DITCH ERROR HANDLING; Is technically deprecated, care for future
		process.on("unhandledRejection", (err) => {
			if (client.uptime > 0) {
				base.sendError({message: messageBeingProcessed, nosql: nosqlDB}, err);
			}
			messageBeingProcessed = undefined;
		});
		process.on("uncaughtException", (err) => {
			if (client.uptime > 0) {
				base.sendError({message: messageBeingProcessed, nosql: nosqlDB}, err);
			}
			messageBeingProcessed = undefined;
		});

		let bot_secret_token = security.token;

		await client.login(bot_secret_token);
	})
});

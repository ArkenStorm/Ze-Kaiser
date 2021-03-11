const Discord = require('discord.js');
const moment = require('moment');

function processAttachment(attachment) {
	const imageLink = attachment.split('.');
	const typeOfImage = imageLink[imageLink.length - 1];
	const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
	if (!image) {
		return '';
	};
	return attachment;
}

function generateEmbed(message, starEmoji, embedColor, minCount) {
	let image = message.attachments.size > 0 ? processAttachment(message.attachments.array()[0].url) : '';
	if (image === '') {
		if (message.embeds.length) {
			const embed = message.embeds[0];
			if (embed.type === 'image') {
				image = embed.thumbnail.url;
			}
		}
	}

	// If the message is empty, we don't allow the user to star the message.
	if (image === '' && message.cleanContent.length < 1) {
		throw message.channel.send(`You cannot star an empty message.`);
	}

	let reactionCount = 0;
	const starReactionObj = message.reactions.cache.find(x => x.emoji.name === starEmoji);
	if (starReactionObj) {
		reactionCount = starReactionObj.count;
		if (starReactionObj.users.cache.has(message.author.id)) {
			reactionCount -= 1;
		}
	}

	if (reactionCount < minCount) {
		reactionCount = 0; // Force message deletion and such if below threshold
	}

	return new Discord.MessageEmbed()
		.setColor(embedColor)
		.setDescription(message.cleanContent)
		.setAuthor(message.member.displayName, message.author.displayAvatarURL)
		.setTimestamp(new Date())
		.setFooter(`${message.id}`)
		.addField(':star: Stars', reactionCount.toString(), true) // TODO: change this to the config star emoji
		.addField('Channel', message.channel, true)
		.addField(':arrow_heading_up: Jump', `[Click Me](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`, true)
		.setImage(image);
}

async function applyStarboardMessage(message, starEmoji, embedColor, minCount, subtract = false) {
	const starChannel = message.guild.channels.cache.find(channel => channel.name.toLowerCase().indexOf('starboard') !== -1);
	if (!starChannel && message.reactions.cache.size === 1 && !subtract) { // only happens when the first emoji is added on a message
		return message.channel.send(`It appears that you do not have a \`Starboard\` channel.`);
	}

	try {
		const embed = generateEmbed(message, starEmoji, embedColor, minCount);
		const reactionCount = parseInt(embed.fields[0].value);

		// If a star message already exists, edit the old one instead of making a new one
		const fetch = await starChannel.messages.fetch({ limit: 100 });
		const oldStarMessage = fetch.find(m => m.embeds.length && m.embeds[0].footer.text.endsWith(message.id));
		if (oldStarMessage) {
			const starMsg = await starChannel.messages.fetch(oldStarMessage.id);

			if (reactionCount === 0) {
				// No reactions, delete the message
				await starMsg.delete({timeout: 1000});
			} else {
				await starMsg.edit({ embed });
			}
		} else if (reactionCount > 0) { // Don't send star embeds with 0 reactions
			await starChannel.send({ embed });
		}

	} catch (e) {
		if (e instanceof Error) {
			console.error(e);
		}
	}
}

let starOwn = moment(); // starts at bot lifetime
let starBot = moment();
const add = async (context) => {
	const reaction = context.reaction;
	const user = context.user;
	const nosql = context.nosql;
	const message = reaction.message;

	const config = nosql.get('config')
		.find({serverID: message.guild.id})
		.value().config

	if (reaction.emoji.name !== config.starEmoji) {
		return;
	}
	const starChannel = message.guild.channels.cache.find(channel => channel.name.toLowerCase().indexOf('starboard') !== -1); // temporary fix
	if (starChannel && reaction.message.channel.id === starChannel.id) {
		return;
	}

	// Sanity checks
	if (message.author.id === user.id) {
		await reaction.users.remove(user); // Remove their star
		// add timer
		if (starOwn < moment()) {
			starOwn.add(2, 'minutes');
			return message.channel.send(`${user}, you cannot star your own messages.`);
		}
		return;
	}

	if (message.author.bot) {
		await reaction.users.remove(user);
		// add timer
		if (starBot < moment()) {
			starBot.add(2, 'minutes');
			return message.channel.send(`${user}, you cannot star bot messages.`);
		}
		return;
	}

	await applyStarboardMessage(message, config.starEmoji, config.starEmbedColor, config.starMinCount || 1);
}

const subtract = async (context) => {
	const reaction = context.reaction;
	const user = context.user;
	const nosql = context.nosql;
	const message = reaction.message;

	const config = nosql.get('config')
		.find({serverID: message.guild.id})
		.value().config

	if (reaction.emoji.name !== config.starEmoji) {
		return;
	}

	// Sanity checks
	if (message.author.id === user.id || message.author.bot) {
		return;
	}

	await applyStarboardMessage(message, config.starEmoji, config.starEmbedColor, config.starMinCount || 1,  true);
}

module.exports = {
	add,
	subtract
};

const Discord = require('discord.js');
const config = require('../config.json');

const starEmoji = config.starEmoji;
const embedColor = config.starEmbedColor;
const minCount = config.starMinCount || 1;

function processAttachment(attachment) {
	const imageLink = attachment.split('.');
	const typeOfImage = imageLink[imageLink.length - 1];
	const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
	if (!image) {
		return '';
	};
	return attachment;
}

function generateEmbed(message) {
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
		throw message.channel.send(`${user}, you cannot star an empty message.`);
	}

	let reactionCount = 0;
	const starReactionObj = message.reactions.find(x => x.emoji.name === starEmoji);
	if (starReactionObj) {
		reactionCount = starReactionObj.count;
		if (starReactionObj.users.has(message.author.id)) {
			reactionCount -= 1;
		}
	}

	if (reactionCount < minCount) {
		reactionCount = 0; // Force message deletion and such if below threshold
	}

	return new Discord.RichEmbed()
		.setColor(embedColor)
		.setDescription(message.cleanContent)
		.setAuthor(message.author.tag, message.author.displayAvatarURL)
		.setTimestamp(new Date())
		.setFooter(`${message.id}`)
		.addField(':star: Stars', reactionCount.toString(), true)
		.addField(':arrow_heading_up: Jump', `[Click Me](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`, true)
		.setImage(image);
}

async function applyStarboardMessage(message) {
	const starChannel = message.guild.channels.find(channel => channel.name == 'starboard-channel');
	if (!starChannel) {
		return message.channel.send(`It appears that you do not have a \`Starboard\` channel.`);
	}

	try {
		const embed = generateEmbed(message);
		const reactionCount = parseInt(embed.fields[0].value);

		// If a star message already exists, edit the old one instead of making a new one
		const fetch = await starChannel.fetchMessages();
		const oldStarMessage = fetch.find(m => m.embeds.length && m.embeds[0].footer.text.endsWith(message.id));
		if (oldStarMessage) {
			const starMsg = await starChannel.fetchMessage(oldStarMessage.id);

			if (reactionCount === 0) {
				// No reactions, delete the message
				await starMsg.delete(1000);
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

const add = async (reaction, user) => {
	const message = reaction.message;
	if (reaction.emoji.name !== starEmoji) {
		return;
	}

	// Sanity checks
	if (message.author.id === user.id) {
		await reaction.remove(user); // Remove their star
		return message.channel.send(`${user}, you cannot star your own messages.`);
	}

	if (message.author.bot) {
		return;
	}

	await applyStarboardMessage(message);
}

const subtract = async (reaction, user) => {
	const message = reaction.message;
	if (reaction.emoji.name !== starEmoji) {
		return;
	}

	// Sanity checks
	if (message.author.id === user.id) {
		return;
	}

	if (message.author.bot) {
		return;
	}

	await applyStarboardMessage(message);
}

module.exports = {
	add,
	subtract
};

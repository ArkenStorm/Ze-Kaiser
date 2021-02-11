const Discord = require('discord.js');

function processAttachment(attachment) {
	const imageLink = attachment.split('.');
	const typeOfImage = imageLink[imageLink.length - 1];
	const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
	if (!image) {
		return '';
	}
	return attachment;
}

function emojiToString({ name, id, requiresColons }) {
	return requiresColons ? `<:${name}:${id}>` : name;
}

function generateEmbedded({ reaction, config }) {
	const message = reaction.message;
	let image =
		message.attachments.size > 0
			? processAttachment(message.attachments.array()[0].url)
			: '';
	if (image === '') {
		if (message.embeds.length) {
			const embed = message.embeds[0];
			if (embed.type === 'image') {
				image = embed.thumbnail.url;
			}
		}
	}

	const allReactions = message.reactions.cache;
	const countDisplayString = allReactions
		.array()
		// filter out those below the minimum
		.filter((r) => {
			const minCount =
				config.reactionOverrides[r.emoji.id] ??
				config.reactionOverrides[r.emoji.name] ??
				config.defaultReactionMinCount;
			return r.count >= minCount;
		})
		// sort by most reactions
		.sort((a, b) => a.count - b.count)
		// only take the top 5 reactions
		.filter((_r, i) => i < 5)
		// make each one into a string like "👍: 15"
		.map((r) => `${emojiToString(r.emoji)}: ${r.count}`)
		.join('\n');

	if (countDisplayString === '') {
		return null;
	}

	let authorDisplayString = message.author.tag;
	// message.member.displayName is preferred, but it's not always available due to permissions shenangins.
	if (message.member?.displayName) {
		authorDisplayString = message.member.displayName;
	}

	return new Discord.MessageEmbed()
		.setColor(config.reactionEmbedColor)
		.setDescription(message.cleanContent)
		.setAuthor(authorDisplayString, message.author.displayAvatarURL)
		.setTimestamp(new Date())
		.setFooter(`${message.id}`)
		.addField('Reactions', countDisplayString, true)
		.addField('Channel', message.channel, true)
		.addField(
			':arrow_heading_up: Jump',
			`[Click Me](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`,
			true
		)
		.setImage(image);
}

async function sendReactionboardMessage({ reaction, user, nosqlDB, subtract }) {
	console.log(`Do we have a reaction? ${Boolean(reaction)}`);
	const message = reaction.message;

	if (message.author.id === user.id || message.author.bot) {
		return;
	}

	const config = nosqlDB
		.get('config')
		.find({ serverID: message.guild.id })
		.value().config;

	if (!config.reactionBoardChannelId) {
		console.error(
			`reactionBoardChannelId not defined for server ID ${message.guild.id}`
		);
		return;
	}
	const reactionboardChannel = message.guild.channels.resolve(
		config.reactionBoardChannelId
	);

	const embed = generateEmbedded({ reaction, config });

	try {
		const oldReactionMessages = await reactionboardChannel.messages.fetch({
			limit: 100
		});
		let oldMessage = oldReactionMessages.find(
			(m) => m.embeds.length && m.embeds[0].footer.text.endsWith(message.id)
		);

		if (oldMessage) {
			oldMessage = await reactionboardChannel.messages.fetch(oldMessage.id);

			if (embed === null) {
				await oldMessage.delete({ timeout: 1000 });
			} else {
				await oldMessage.edit({ embed });
			}
		} else if (embed !== null) {
			await reactionboardChannel.send(embed);
		}
	} catch (e) {
		if (e instanceof Error) {
			console.error(e);
		}
	}
}

module.exports = {
	add: (context) => sendReactionboardMessage({ ...context, subtract: false }),
	subtract: (context) =>
		sendReactionboardMessage({ ...context, subtract: true })
};

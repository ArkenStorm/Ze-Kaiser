const axios = require('axios').default;
const { exec } = require('child_process');
const fs = require("fs");
const tmp = require('tmp-promise');
const base = require('../base-commands/base');
const config = require('../config.json');
const memeMap = require('../misc-files/memeMap');

tmp.setGracefulCleanup();

let smited = new Set();
let ignoredChannels = new Set();

const meme = (receivedMessage, command, caption) => {
	if (!memeMap[command]) {
		receivedMessage.channel.send('How did you do this?', {
			files: ['./misc-files/is_that_legal.gif']
		}).catch((err) => {
			base.sendError(receivedMessage, err);
		});
	}
	else {
		receivedMessage.channel.send((caption || memeMap[command].caption), {
			files: [memeMap[command].file]
		}).catch((err) => {
			base.sendError(receivedMessage, err);
		});
	}

	receivedMessage.delete().catch((err) => {
		base.sendError(receivedMessage, err);
	});
}

const autoReact = (messageReaction) => {
	if (messageReaction.me || messageReaction.message.author == client.user ||
		messageReaction.count > 1 || messageReaction.emoji.name === config.starEmoji) {
		return;
	}
	if (messageReaction.emoji.name.toLowerCase() === 'same' || messageReaction.emoji.name.toLowerCase() === 'no_u' || messageReaction.emoji.name.toLowerCase() === 'nou') {
		const random = Math.round(Math.random() * 100);
		if (random % 5 === 0) {
			messageReaction.message.react(messageReaction.emoji);
		}
	}
	else {
		const random = Math.round(Math.random() * 100);
		if (random % 100 === 0) {
			messageReaction.message.react(messageReaction.emoji);
		}
	}
}

const smite = (receivedMessage) => {
	if (!receivedMessage.mentions.users.first()) {
		meme(receivedMessage, 'illegal');
		return;
	}

	if (receivedMessage.mentions.users.first().id === receivedMessage.author.id) {
		receivedMessage.channel.send(`${client.emojis.cache.get('623553767467384832')}`);
		return;
	}

	if (!config.administrators.includes(receivedMessage.author.id)) {
		receivedMessage.channel.send(`You fool. Only now, at the end, do you understand. Your feeble skills are no match for the power of Ze Kaiser! Now, ${receivedMessage.author}, I shall smite thee!`,
		{
			files: ['./misc-files/smite.gif']
		});
		smited.add(receivedMessage.author);
		return;
	}

	if (receivedMessage.mentions.users.first()) {
		if (config.administrators.includes(receivedMessage.mentions.users.first().id)) {
			receivedMessage.channel.send('That user would kill me if I smote them, so no.');
		} else {
			smited.add(receivedMessage.mentions.users.first());
			receivedMessage.channel.send(`${receivedMessage.mentions.users.first()}, I smite thee!`, {
				files: ['./misc-files/smite.gif']
			});
		}
	}
}

const unsmite = (receivedMessage) => {
	if (!config.administrators.includes(receivedMessage.author.id)) {
		receivedMessage.channel.send(`What, *exactly*, do you think you\'re doing, ${receivedMessage.author}?`);
		return;
	}
	if (!receivedMessage.mentions.users.first()) {
		meme(receivedMessage, 'illegal');
		return;
	}
	if (smited.delete(receivedMessage.mentions.users.first())) {
		receivedMessage.channel.send(`${receivedMessage.mentions.users.first()}, I am altering the deal. Pray I do not alter it further.`);
	}
	else {
		receivedMessage.reply("That user has not incurred your wrath at this time.");
	}
}

const avatar = (receivedMessage) => {
	if (!receivedMessage.mentions.users.size) {
		let embed = new Discord.MessageEmbed()
			.setImage(receivedMessage.author.displayAvatarURL({dynamic: true}))
			.setColor('#2295d4');
		return receivedMessage.channel.send('Your avatar: ', {
			embed: embed
		});
	}
	for (const [snowflake, user] of receivedMessage.mentions.users) {
		let embed = new Discord.MessageEmbed()
			.setImage(user.displayAvatarURL({dynamic: true}))
			.setColor('#2295d4');
		receivedMessage.channel.send(`${user.username}\'s avatar: `, {
			embed: embed
		});
	}
	receivedMessage.delete().catch((err) => {
		base.sendError(receivedMessage, err);
	});
}

const warning = (receivedMessage) => {
	if (!receivedMessage.member) {
		receivedMessage.channel.send('Why are you trying this command here?')
		.catch((err) => {
			base.sendError(receivedMessage, err);
		});
		return;
	}
	let caption = '';
	if (receivedMessage.mentions.users.size) {
		caption = receivedMessage.mentions.users.array().join(' ');
	}
	receivedMessage.channel.send(caption, {
		files: ['./misc-files/buhgok.png']
	}).catch((err) => {
		base.sendError(receivedMessage, err);
	});
	receivedMessage.delete().catch((err) => {
		base.sendError(receivedMessage, err);
	});
}

const checkVideo = (url) => {
	const imageLink = url.split('.');
	const typeOfAttachment = imageLink[imageLink.length - 1];
	const image = /(mp4|mkv|webm|mov)/gi.test(typeOfAttachment);
	if (!image) {
		return '';
	};
	return url;
}

const urlRegex = /(https?|ftp):\/\/[^\s\/$.?#].[^\s]*/;
const vidtogif = async (message) => {
	let image = '';

	if (message.attachments.size > 0) {
		image = checkVideo(message.attachments.array()[0].url);
	}

	const textUrl = urlRegex.exec(message.content);
	if (image === '' && textUrl) {
		image = checkVideo(textUrl[0]);
	}

	if (image === '' && message.embeds.length) {
		const embed = message.embeds[0];
		if (embed.type === 'video') {
			image = embed.url;
		}
	}

	// If we still don't have an video
	if (image === '') {
		return message.reply(`Please give me a video to work with!`);
	}

	let fileResponse;
	try {
		fileResponse = await axios.get(image, {responseType: 'stream', maxContentLength: config.maxVideoSize, timeout: config.videoDownloadTimeout});
	} catch (e) {
		if (e.toJSON) {
			const err = e.toJSON();
			if (err.message.includes("timeout"))
				return message.reply(`Video download timed-out!`);

			else if (err.message.includes("maxContentLength"))
				return message.reply(`That video is too large (${(config.maxVideoSize / 1000000).toFixed()}MB cap)!`);

			else {
				base.sendError(message, e);
				return message.reply(`Something went wrong downloading the video. An admin has been notified of this.`);
			}

		} else {
			base.sendError(message, e);
			return message.reply(`Something went very wrong downloading the video. An admin has been notified of this.`);
		}
	}

	const videoStream = fileResponse.data;

	const tempVideoFile = await tmp.file();
	const fileStream = fs.createWriteStream(tempVideoFile.path);

	await new Promise((resolve, reject) => {
		videoStream.on('close', resolve);
		videoStream.on('error', reject);
		fileStream.on('error', reject);

		videoStream.pipe(fileStream);
	});

	const tempGIFFile = await tmp.file({postfix: ".gif"});

	const workingMessage = await message.reply("Working on it!");

	exec(`yes | ffmpeg -i ${tempVideoFile.path} -vf "fps=30,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 -f gif ${tempGIFFile.path}`,
		async (error, stdout, stderr) => {
			try {
				if (error) {
					base.sendError(message, error);
					return message.reply(`Something went wrong encoding the GIF. An admin has been notified of this.`);
				}

				// Otherwise it's good, lets send the GIF!
				await message.reply("posted this:", {
					files: [tempGIFFile.path]
				});

				await workingMessage.delete();

				await message.delete();
			} catch (err) {
				await message.reply(`Something went wrong sending the GIF. An admin has been notified of this.`);
				base.sendError(message, err);
			} finally {
				tempVideoFile.cleanup();
				tempGIFFile.cleanup();
			}
		});
}

const startListening = (receivedMessage, channel) => {
	if (!config.administrators.includes(receivedMessage.author.id)) {
		receivedMessage.channel.send(`Why must you be like this, ${receivedMessage.author}?`);
		return;
	}
	
	if (channel) {
		ignoredChannels.delete(channel);
		return;
	}

	let silencedChannel = receivedMessage.mentions.channels.first() || receivedMessage.channel;
	ignoredChannels.delete(silencedChannel);
	receivedMessage.channel.send(`I will no longer ignore ${silencedChannel}.`).catch((err) => {
		base.sendError(receivedMessage, err);
	});
}

const stopListening = (receivedMessage, timeout = 0) => {
	if (!config.administrators.includes(receivedMessage.author.id)) {
		receivedMessage.channel.send(`You can't tell me what to do, ${receivedMessage.author}!`);
		return;
	}

	let time;
	if (typeof timeout === 'object' && typeof timeout[timeout.length - 1] === 'string') {
		time = parseInt(timeout[timeout.length - 1], 10);
	}

	let channel = receivedMessage.mentions.channels.first() || receivedMessage.channel;
	ignoredChannels.add(channel);
	receivedMessage.channel.send(`I will ignore ${channel} for the time being.`).catch((err) => {
		base.sendError(receivedMessage, err);
	});

	if (time) {
		setTimeout(() => startListening(receivedMessage, channel), time);
	}
}

const getXkcdComicInfo = async (num) => {
	const response = await axios.get(`https://xkcd.com/${num}/info.0.json`);
		if (response.status !== 200) {
			// send error
			base.sendError(receivedMessage, `Failed to get comic #${num}\n${response.status}: ${response.statusText}`)
			return;
		}
		return response.data;
}

const xkcd = async (receivedMessage, args) => {
	const requestedComic = (args[0] || "").trim();
	let num;
	if (!requestedComic) {
		// latest. It works
		num = "";
	}
	else if (/^\d+$/.test(requestedComic)) {
		num = requestedComic;
	} else if (requestedComic === "random") {
		const latest = await getXkcdComicInfo("");
		num = Math.floor(Math.random() * (latest.num + 1));
	} else {
		return xkcdsearch(receivedMessage, args);
	}
	receivedMessage.delete();
	if (parseInt(num) === 404) {
		receivedMessage.channel.send("Error 404: comic not found");
		return;
	}
	const comic = await getXkcdComicInfo(num);

	const comicEmbed = new Discord.MessageEmbed()
		.setColor('#1A73E8')
		.setTitle(`xkcd #${num}: ${comic.title}`)
		.setImage(comic.img)
		.setURL(`https://xkcd.com/${num}`)
		.setFooter(comic.alt);
	receivedMessage.channel.send(comicEmbed);
}

const xkcdsearch = async (receivedMessage, args) => {
	const terms = args.join("+");
	if (!terms) {
		receivedMessage.channel.send(`You forgot a search term.`);
		return;
	}
	const response = await axios.get(`https://www.explainxkcd.com/wiki/index.php?search=${terms}&title=Special%3ASearch&go=Go`)
	if (response.status !== 200) {
		// send error
		base.sendError(receivedMessage, `Failed to search explainxkcd.com for ${terms} #${num}\n${response.status}: ${response.statusText}`)
		return;
	}
	if (/There were no results matching the query/.test(response.data)) {
		receivedMessage.channel.send("No results");
		return;
	}
	let selector;
	if (/mw-search-results/.test(response.data)) {
		// direct comic page
		selector = "mw-search-results";
	} else {
		// search results page
		selector = `<h1 id="firstHeading" class="firstHeading" lang="en">`;
	}
	const htmlToSearch = (response.data.split(selector) || [])[1];
	if (!htmlToSearch) {
		receivedMessage.channel.send("No (usable) results");
		return;
	}
	const num = (htmlToSearch.match(/\d+(?=:)/) || [])[0];
	if (!num) {
		receivedMessage.channel.send("No (usable) results");
		return;
	}
	const comic = await getXkcdComicInfo(num);
	const comicEmbed = new Discord.MessageEmbed()
		.setColor('#1A73E8')
		.setTitle(`xkcd #${num}: ${comic.title}`)
		.setImage(comic.img)
		.setURL(`https://xkcd.com/${num}`)
		.setFooter(comic.alt);
	receivedMessage.channel.send(comicEmbed);
}

module.exports = {
	meme,
	autoReact,
	smite,
	unsmite,
	smited,
	avatar,
	warning,
	vidtogif,
	startListening,
	stopListening,
	ignoredChannels,
	xkcd,
	xkcdsearch
};

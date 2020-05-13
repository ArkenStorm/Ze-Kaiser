const axios = require('axios').default;
const { exec } = require('child_process');
const fs = require("fs");
const tmp = require('tmp-promise');
const base = require('../base-commands/base');
const config = require('../config.json');

tmp.setGracefulCleanup();

let smited = [];

const meme = (receivedMessage, command) => {
	let file;
	let caption = '';
	switch(command) {
		case 'cooldudes':
			caption = 'Oh no!'
			file = './misc-files/taking-over.jpg';
			break;
		case 'bamboozled':
			file = './misc-files/bamboozled.jpg';
			break;
		case 'illegal':
			file = './misc-files/waitthatsillegal.jpg';
			break;
		case 'ontopic':
			file = './misc-files/ontarget.gif';
			break;
		case 'bigbean':
			file = './misc-files/big_bean_time.png';
			break;
		case 'bigbrain':
			file = './misc-files/big_brain_time.jpg';
			break;
		case 'kronk':
		case 'comingtogether':
			file = './misc-files/coming_together.png';
			break;
		case 'dewit':
		case 'doit':
			file = './misc-files/dewit.gif';
			break;
		default:
			caption = 'How did you do this?';
			file = './misc-files/is_that_legal.gif';
			break;
	}

	receivedMessage.channel.send(caption, {
		files: [file]
	}).catch((err) => {
		base.sendError(receivedMessage, err);
	});
	receivedMessage.delete().catch((err) => {
		base.sendError(receivedMessage, err);
	});
}

const autoReact = (messageReaction) => {
	if (messageReaction.me) {
		return;
	}
	if (messageReaction.message.reactions.length > 1) {
		return;
	}
	if (messageReaction.emoji.name === config.starEmoji) {
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
	if (receivedMessage.mentions.users.first().id === receivedMessage.author.id) {
		receivedMessage.channel.send(`${client.emojis.cache.get('623553767467384832')}`);
		return;
	}

	if (!config.administrators.includes(receivedMessage.author.id)) {
		receivedMessage.channel.send(`You fool. Only now, at the end, do you understand. Your feeble skills are no match for the power of Ze Kaiser! Now, ${receivedMessage.author}, I shall smite thee!`,
		{
			files: ['./misc-files/smite.gif']
		});
		smited.push(receivedMessage.author);
		return;
	}

	if (receivedMessage.mentions.users.first()) {
		if (config.administrators.includes(receivedMessage.mentions.users.first().id)) {
			receivedMessage.channel.send('That user would kill me if I smote them, so no.');
		} else {
			smited.push(receivedMessage.mentions.users.first());
			receivedMessage.channel.send(`${receivedMessage.mentions.users.first()}, I smite thee!`, {
				files: ['./misc-files/smite.gif']
			});
		}
	}
}

const unsmite = (receivedMessage) => {
	for (let i = 0; i < smited.length; i++) {
		if (smited[i] === receivedMessage.mentions.users.first()) {
			smited.splice(i, 1);
			receivedMessage.channel.send(`${receivedMessage.mentions.users.first()}, I am altering the deal. Pray I do not alter it further.`);
			break;
		}
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
		return message.channel.send(`Please give me a video to work with!`);
	}

	let fileResponse;
	try {
		fileResponse = await axios.get(image, {responseType: 'stream', maxContentLength: config.maxVideoSize, timeout: config.videoDownloadTimeout});
	} catch (e) {
		if (e.toJSON) {
			const err = e.toJSON();
			if (err.message.includes("timeout"))
				return message.channel.send(`Video download timed-out!`);

			else if (err.message.includes("maxContentLength"))
				return message.channel.send(`That video is too large (${(config.maxVideoSize / 1000000).toFixed()}MB cap)!`);

			else {
				base.sendError(message, e);
				return message.channel.send(`Something went wrong downloading the video. An admin has been notified of this.`);
			}

		} else {
			base.sendError(message, e);
			return message.channel.send(`Something went very wrong downloading the video. An admin has been notified of this.`);
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

	exec(`yes | ffmpeg -i ${tempVideoFile.path} -vf "fps=30,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 -f gif ${tempGIFFile.path}`,
		async (error, stdout, stderr) => {
			try {
				if (error) {
					base.sendError(message, error);
					return message.channel.send(`Something went wrong encoding the GIF. An admin has been notified of this.`);
				}

				// Otherwise it's good, lets send the GIF!
				await message.reply("posted this:", {
					files: [tempGIFFile.path]
				}).catch((err) => {
					base.sendError(receivedMessage, err);
				});

				await workingMessage.delete().catch((err) => {
					base.sendError(receivedMessage, err);
				});

				await message.delete().catch((err) => {
					base.sendError(receivedMessage, err);
				});
			} finally {
				tempVideoFile.cleanup();
				tempGIFFile.cleanup();
			}
		});
}

module.exports = {
	meme,
	autoReact,
	smite,
	unsmite,
	smited,
	avatar,
	warning,
	vidtogif
};

const base = require('../base-commands/base');

let smited = [];

const cooldudes = (receivedMessage) => {
    receivedMessage.channel.send('Oh no!', {
        files: ['./misc-files/taking-over.jpg']
    }).catch((err) => {
        base.sendError(receivedMessage, err);
    });
    receivedMessage.delete().catch((err) => {
        base.sendError(receivedMessage, err);
    });
}

const bamboozled = (receivedMessage) => {
	receivedMessage.channel.send({
		files: ['./misc-files/bamboozled.jpg']
	}).catch((err) => {
        base.sendError(receivedMessage, err);
    });
    receivedMessage.delete().catch((err) => {
        base.sendError(receivedMessage, err);
    });
}

const illegal = (receivedMessage) => {
    receivedMessage.channel.send({
        files: ['./misc-files/waitthatsillegal.jpg']
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
    if (messageReaction.emoji.name === 'same' || messageReaction.emoji.name.toLowerCase() === 'no_u' || messageReaction.emoji.name.toLowerCase() === 'nou') {
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
    if (receivedMessage.mentions.users.first()) {
        if (receivedMessage.mentions.users.first().id === '400191346742263818' || receivedMessage.mentions.users.first().id === '358333674514677760') {
            //First is my ID, then Taylor's ID
            receivedMessage.channel.send('That user would kill me if I denied them, so no.');
        } else {
            smited.push(receivedMessage.mentions.users.first());
            receivedMessage.channel.send(`${receivedMessage.mentions.users.first()} has been denied.`);     //Change to post the Odin "BANISHED" GIF
        }
    }
}

const unsmite = (receivedMessage) => {
    for (let i = 0; i < denied.length; i++) {
        if (smited[i] === receivedMessage.mentions.users.first()) {
            smited.splice(i, 1);
            receivedMessage.channel.send(`${receivedMessage.mentions.users.first()} has been allowed.`);      //Change this to be something cool
            break;
        }
    }
}

module.exports = {
	cooldudes,
    bamboozled,
    illegal,
    autoReact,
    smite,
    unsmite,
    smited
};
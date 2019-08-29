const base = require('../base-commands/base');

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

module.exports = {
	cooldudes,
    bamboozled,
    illegal,
    autoReact
};
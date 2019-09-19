const base = require('../base-commands/base');
const config = require('../config.json');

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
        receivedMessage.channel.send(`${client.emojis.get('623553767467384832')}`);
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

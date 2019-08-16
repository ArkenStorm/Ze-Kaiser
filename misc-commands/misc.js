const cooldudes = (receivedMessage) => {
    receivedMessage.channel.send('Oh no!', {
        files: ['./misc-files/taking-over.jpg']
    }).catch((err) => {
        client.fetchUser('400191346742263818').then((user) => { //Zealot's ID
            user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
        });
        client.fetchUser('358333674514677760').then((user) => { //Arken's ID
            user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
        })
    });
}

const bamboozled = (receivedMessage) => {
	receivedMessage.channel.send({
		files: ['./misc-files/bamboozled.jpg']
	}).catch((err) => {
        client.fetchUser('400191346742263818').then((user) => { //Zealot's ID
            user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
        });
        client.fetchUser('358333674514677760').then((user) => { //Arken's ID
            user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
        });
    });
}

const illegal = (receivedMessage) => {
    receivedMessage.channel.send({
        files: ['./misc-files/waitthatsillegal.jpg']
    }).catch((err) => {
        client.fetchUser('400191346742263818').then((user) => { //Zealot's ID
            user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
        });
        client.fetchUser('358333674514677760').then((user) => { //Arken's ID
            user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
        });
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
        const random = Math.round(Math.random() * 10);
        if (random % 2 === 0) {
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
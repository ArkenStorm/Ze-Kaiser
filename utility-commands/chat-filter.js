const base = require('../base-commands/base');
const config = require('../config.json');

// I promise this is for a good cause!
const vulgarity = ['damn', 'shit', 'fuck', 'bitch', 'cunt', 'nigger'];

const filter = (receivedMessage) => {
    const modChannel = message.guild.channels.find(channel => channel.name == 'mod-logs');
    vulgarity.forEach(word => {
        if (receivedMessage.content.indexOf(word) != -1) {
            receivedMessage.delete().catch((err) => {
                base.sendError(receivedMessage, err);
            });
            receivedMessage.channel.send({
                files: ['./misc-files/christian-server.jpg']
            }).catch((err) => {
                base.sendError(receivedMessage, err);
            });
            let modMessage = `${receivedMessage.author} sent this message at ${receivedMessage.createdAt}: ${receivedMessage.content}`;
            if (modChannel) {
                modChannel.send(modMessage);
            }
            else {
                config.administrators.forEach(userID => {
                    client.fetchUser(userID).then((user) => {
                        user.send(modMessage);
                    });
                });
            }
            return false;
        }
    });
}

module.exports = {
    filter
}
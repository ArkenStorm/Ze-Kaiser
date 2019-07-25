const cooldudes = async (receivedMessage) => {
    receivedMessage.channel.send('Oh no!', {
        files: [
            './misc-files/taking-over.jpg'
        ]
    });
}

module.exports = {
    cooldudes
};
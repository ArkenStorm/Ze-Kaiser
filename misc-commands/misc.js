const cooldudes = (receivedMessage) => {
    receivedMessage.channel.send('Oh no!', {
        files: [
            './misc-files/taking-over.jpg'
        ]
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
		files: [
			'./misc-files/bamboozled.jpg'
		]
	}).catch((err) => {
        client.fetchUser('400191346742263818').then((user) => { //Zealot's ID
            user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
        });
        client.fetchUser('358333674514677760').then((user) => { //Arken's ID
            user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
        })
    });
}

module.exports = {
	cooldudes,
	bamboozled
};
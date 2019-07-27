const addRole = (receivedMessage, role) => {
    if (role == undefined || role== '') {
        receivedMessage.channel.send('I need a role to try to add!');
        return;
    }
    //receivedMessage.guild.roles

    receivedMessage.channel.send(`${receivedMessage.author} , you have been given the ${role} role. (ok, not yet)`).catch((err) => {
        client.fetchUser('400191346742263818').then((user) => { //Zealot's ID
            user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
        });
        client.fetchUser('358333674514677760').then((user) => { //Arken's ID
            user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
        })
    });
}

module.exports = {
    addRole
};
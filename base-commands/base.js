const addRole = (receivedMessage, role) => {
    if (role == undefined || role == '') {
        receivedMessage.channel.send('I need a role to try to add!');
        return;
    }
    role = role.join(' ');  //For roles with multiple words

    const teRole = receivedMessage.guild.roles.find(teRole => teRole.name === role);

    receivedMessage.member.addRole(teRole).then(() => {
        receivedMessage.channel.send(`${receivedMessage.author}, you have been given the "${role}" role.`).catch((err) => {
            client.fetchUser('400191346742263818').then((user) => { //Zealot's ID
                user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
            });
            client.fetchUser('358333674514677760').then((user) => { //Arken's ID
                user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
            });
        });
    }).catch((err) => {
        receivedMessage.channel.send('Failed to add the role.  You either spelled it wrong or tried to add a role only the mods can give you.');
        client.fetchUser('400191346742263818').then((user) => { //Zealot's ID
            user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
        });
        client.fetchUser('358333674514677760').then((user) => { //Arken's ID
            user.send(`I borked.  Message: ${receivedMessage.content} \n Error: ${err}`);
        });
    });
}

module.exports = {
    addRole
};
const Discord = require('discord.js');
const client = new Discord.Client();
const security = require('./auth.json');

const misc = require('./misc-commands/misc');

client.on('ready', () => {
    console.log('Connected as ' + client.user.tag);
});

client.on('message', (receivedMessage) => {
    if (receivedMessage.author === client.user) {   //Make sure the bot doesn't respond to itself, otherwise weird loopage may occur
        return;
    }

    if (receivedMessage.content.startsWith('!')) {
        processCommand(receivedMessage);
    }
});

const processCommand = (receivedMessage) => {
    let fullCommand = receivedMessage.content.substr(1) // Remove the leading character
    let splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space
    let primaryCommand = splitCommand[0] // The first word directly after the exclamation is the command
    primaryCommand = primaryCommand.toLowerCase();  //make the command lower case to eliminate case sensitivity
    let arguments = splitCommand.slice(1) // All other words are arguments/parameters/options for the command

    switch(primaryCommand) {
        case 'cooldudes':
            misc.cooldudes(receivedMessage);
            break;
        default:
            receivedMessage.channel.send('Invalid command.');
    }
}

bot_secret_token = security.token;

client.login(bot_secret_token);
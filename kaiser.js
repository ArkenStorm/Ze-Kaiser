const Discord = require('discord.js');
const client = new Discord.Client();
const security = require('./auth.json');

client.on('ready', () => {
    console.log('Connected as ' + client.user.tag);
});

bot_secret_token = security.token;

client.login(bot_secret_token);
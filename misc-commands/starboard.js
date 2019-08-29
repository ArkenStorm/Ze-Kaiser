const add = async (reaction, user) => {
  const message = reaction.message;
    // This is the first check where we check to see if the reaction is not the unicode star emote.
  if (reaction.emoji.name !== '⭐') {
    return;
  }
    // Here we check to see if the person who reacted is the person who sent the original message.
  if (message.author.id === user.id) {
    return message.channel.send(`${user}, you cannot star your own messages.`);
  }
  // This is our final check, checking to see if message was sent by a bot.
  if (message.author.bot) {
    return message.channel.send(`${user}, you cannot star bot messages.`);
  }
  // Here we get the starboard channel from the guilds settings. 
  //const { starboardChannel } = this.client.settings.get(message.guild.id);
  // Here we will find the channel
  const starChannel = message.guild.channels.find(channel => channel.name == 'starboard-channel');
  // If there's no starboard channel, we stop the event from running any further, and tell them that they don't have a starboard channel.
  if (!starChannel) {
    return message.channel.send(`It appears that you do not have a \`Starboard\` channel.`); 
  }
  // Here we fetch 100 messages from the starboard channel.
  const fetch = await starChannel.fetchMessages({ limit: 100 }); 
  // We check the messages within the fetch object to see if the message that was reacted to is already a message in the starboard,
  const stars = fetch.find(m => m.embeds[0].footer.text.startsWith('⭐') && m.embeds[0].footer.text.endsWith(message.id));

  // Now we setup an if statement for if the message is found within the starboard.
  if (stars) {
    // Regex to check how many stars the embed has.
    const star = /^\⭐\s([0-9]{1,3})\s\|\s([0-9]{17,20})/.exec(stars.embeds[0].footer.text);
    // A variable that allows us to use the color of the pre-existing embed.
    const foundStar = stars.embeds[0];
    // We use the this.extension function to see if there is anything attached to the message.
    const image = message.attachments.size > 0 ? await extension(reaction, message.attachments.array()[0].url) : ''; 
    const embed = new Discord.RichEmbed()
      .setColor(foundStar.color)
      .setDescription(foundStar.description)
      .setAuthor(message.author.tag, message.author.displayAvatarURL)
      .setTimestamp()
      .setFooter(`⭐ ${parseInt(star[1])+1} | ${message.id}`)
      .setImage(image);
    // We fetch the ID of the message already on the starboard.
    const starMsg = await starChannel.fetchMessage(stars.id);
    // And now we edit the message with the new embed!
    await starMsg.edit({ embed });
  }

  // Now we use an if statement for if a message isn't found in the starboard for the message.
  if (!stars) {
    // We use the this.extension function to see if there is anything attached to the message.
    const image = message.attachments.size > 0 ? await extension(reaction, message.attachments.array()[0].url) : ''; 
    // If the message is empty, we don't allow the user to star the message.
    if (image === '' && message.cleanContent.length < 1) return message.channel.send(`${user}, you cannot star an empty message.`); 
    const embed = new Discord.RichEmbed()
      // We set the color to a nice yellow here.
      .setColor(15844367)
      // Here we use cleanContent, which replaces all mentions in the message with their
      // equivalent text. For example, an @everyone ping will just display as @everyone, without tagging you!
      // At the date of this edit (09/06/18) embeds do not mention yet.
      // But nothing is stopping Discord from enabling mentions from embeds in a future update.
      .setDescription(message.cleanContent) 
      .setAuthor(message.author.tag, message.author.displayAvatarURL)
      .setTimestamp(new Date())
      .setFooter(`⭐ 1 | ${message.id}`)
      .setImage(image);
    await starChannel.send({ embed });
  }
}

const subtract = async (reaction, user) => {
  const message = reaction.message;
  if (message.author.id === user.id) {
    return;
  }
  if (reaction.emoji.name !== '⭐') {
    return;
  }
   // Here we get the starboard channel from the guilds settings. 
  //const { starboardChannel } = this.client.settings.get(message.guild.id);
  // Here we will find the channel
  const starChannel = message.guild.channels.find(channel => channel.name == 'starboard-channel');
  // If there's no starboard channel, we stop the event from running any further, and tell them that they don't have a starboard channel.
  if (!starChannel) {
    return message.channel.send(`It appears that you do not have a \`Starboard\` channel.`); 
  }
  const fetchedMessages = await starChannel.fetchMessages({ limit: 100 });
  const stars = fetchedMessages.find(m => m.embeds[0].footer.text.startsWith('⭐') && m.embeds[0].footer.text.endsWith(reaction.message.id));
  if (stars) {
    const star = /^\⭐\s([0-9]{1,3})\s\|\s([0-9]{17,20})/.exec(stars.embeds[0].footer.text);
    const foundStar = stars.embeds[0];
    const image = message.attachments.size > 0 ? await this.extension(reaction, message.attachments.array()[0].url) : '';
    const embed = new RichEmbed()
      .setColor(foundStar.color)
      .setDescription(foundStar.description)
      .setAuthor(message.author.tag, message.author.displayAvatarURL)
      .setTimestamp()
      .setFooter(`⭐ ${parseInt(star[1])-1} | ${message.id}`)
      .setImage(image);
    const starMsg = await starChannel.fetchMessage(stars.id);
    await starMsg.edit({ embed });
    if(parseInt(star[1]) - 1 == 0) {
      return starMsg.delete(1000)
    };
  }
}

 // Here we add the this.extension function to check if there's anything attached to the message.
 const extension = (reaction, attachment) => {
  const imageLink = attachment.split('.');
  const typeOfImage = imageLink[imageLink.length - 1];
  const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
  if (!image) {
    return '';
  };
  return attachment;
}

module.exports = {
  add,
  subtract
};
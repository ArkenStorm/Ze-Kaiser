const {getConfig} = require('../utils');

const tag = async (context) => {
    let receivedMessage = context.message;
    let args = context.args;
    let tagName = "";
    let imageURL = "";
    const config = getConfig(context.message.guild.id, context.nosql);

    if (!config.administrators.includes(receivedMessage.author.id)) {
		return;
	}

    if (args.length === 1 && receivedMessage.attachments.size === 1) {
        receivedMessage.attachments.forEach(attachment => {
            // do something with the attachment
            tagName = args[0].toLowerCase();
            imageURL = attachment.url;
        });
    }
    else if (args.length === 2 && receivedMessage.attachments.size === 0) {
        tagName = args[0].toLowerCase();
        imageURL = args[1];
    }
    else {
        receivedMessage.channel.send("Invalid tag creation.");
        return;
    }

    await context.nosql.get('tags')
        .push({ 'serverID': receivedMessage.guild.id, 'tag': tagName, "imageURL": imageURL})
        .write();

    receivedMessage.channel.send("Tag created successfully!");
}

const untag = async(context) => {
    const config = getConfig(context.message.guild.id, context.nosql);

    if (!config.administrators.includes(receivedMessage.author.id)) {
		return;
	}

    let receivedMessage = context.message;
    let args = context.args;
    if (args.length !== 1) {
        receivedMessage.channel.send("Y'all missed the name!");
        return;
    }
    let tagName = args[0].toLowerCase()
    const foundTag = context.nosql.get('tags')
        .find({"serverID": receivedMessage.guild.id, "tag": tagName})
        .value();
    if (foundTag) {
        await context.nosql.get('tags')
            .remove({"serverID": receivedMessage.guild.id, "tag": tagName})
            .write();
        receivedMessage.channel.send("Tag removed.");
    }
    else {
        receivedMessage.channel.send("Tag not found.");
    }
}

const showTag = async(context) => {
    let receivedMessage = context.message;
    const foundTag = context.nosql.get('tags')
        .find({"serverID": receivedMessage.guild.id, "tag": context.primaryCommand})
        .value();

    receivedMessage.channel.send("", {files: [foundTag.imageURL]}).then(r => {

    }).catch(r => {
        receivedMessage.channel.send("Tag done messed up dawg!");
    })
}

const listTags = async(context) => {
    let receivedMessage = context.message;
    const allTags = context.nosql.get('tags')
        .filter({"serverID": receivedMessage.guild.id})
        .value()
    let tagListEmbed = new Discord.MessageEmbed().setColor('#2295d4');
    let tagText = "";
    allTags.forEach(tag => {
        tagText += tag.tag;
        tagText += '\n';
    })
    tagListEmbed.addField("Tags:", tagText)
    await receivedMessage.channel.send(tagListEmbed);
}

module.exports = {
    tag,
    showTag,
    untag,
    listTags,
};
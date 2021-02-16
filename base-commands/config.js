const contributors = ["358333674514677760", "400191346742263818", "333530784495304705"];

const init = (context) => {
    // run through client.guilds, check configs in nosql db, if not there, create default
    //const foundConfig = context.nosql.get('config')
        //.find({"serverID": context.guild.id})
    context.guilds.cache.forEach((guild, guildId) => {
        const foundConfig = context.nosql.get('config')
            .find({serverID: guildId})
            .value()
        if (!foundConfig) {
            console.log("Config not found, generating a default one...");
            context.nosql.get('config')
                .push({
                    serverID: guildId, 
                    config: {
                        "administrators": [...contributors, guild.ownerID],

                        "retryCount": 3,
                        "hangmanTimeout": 600000,

                        "maxVideoSize": 10000000,
                        "videoDownloadTimeout": 5000,

                        "reactions": {
                            "minCount": 10,
                            "channelID": "",
                            "embedColor": 15844367,
                            "overrides": {
                                "⭐": {
                                    "minCount": 10,
                                    "channelID": "",
                                    "embedColor": ""
                                }
                            }
                        }
                    }
                })
                .write()
        }
    })
    // per server, get highest role of server, add people with that role to admin list
}

const edit = (context) => {
    // list all config properties for the current server, in dms; make sure the user is admin for the server
    // have user select one of the properties
    // after selection, await new input // TODO: MAKE ROBUST ERROR CHECKING
}

module.exports = {
    init,
    edit
}
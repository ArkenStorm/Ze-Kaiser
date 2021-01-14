const misc = require('./misc-commands/misc');
const base = require('./base-commands/base');
const hangman = require('./misc-commands/hangman');
const tag = require('./misc-commands/tag')
const events = require('./utility-commands/events');
const tracking = require('./misc-commands/tracking');
const { xkcd } = require('./misc-commands/xkcd');

const commands = {
	'cooldudes': misc.meme,
	'bamboozled': misc.meme,
	'illegal': misc.meme,
	'ontopic': misc.meme,
	'bigbean': misc.meme,
	'bigbrain': misc.meme,
	'kronk': misc.meme,
	'comingtogether': misc.meme,
	'dewit': misc.meme,
	'doit': misc.meme,
	'thoughtpolice': misc.meme,
	'enjoythings': misc.meme,
	'gasp': misc.meme,
	'whoknew': misc.meme,
	'patience': misc.meme,
	'whomst': misc.meme,
	'itsatrap': misc.meme,
	'facepalm': misc.meme,
	'ironic': misc.meme,
	'addrole': base.addRole,
	'removerole': base.removeRole,
	'addroles': base.addRoles,
	'removeroles': base.removeRoles,
	'complete': base.complete,
	'info': base.info,
	'help': base.help,
	'roles': base.roles,
	'smite': misc.smite,
	'unsmite': misc.unsmite,
	'tothegallows': hangman.hangman,
	'guess': hangman.guess,
	'hset': hangman.hset,
	'avatar': misc.avatar,
	'buhgok': misc.warning,
	'warning': misc.warning,
	'makegif': misc.vidtogif,
	'startlistening': misc.startListening,
	'stoplistening': misc.stopListening,
	'pull': base.gitPull,
	'gitpull': base.gitPull,
	'banish': base.banish,
	'shadowban': base.banish,
	'unbanish': base.unbanish,
	'xkcd': xkcd,
	'event': events.event,
	'tag': tag.tag,
	'untag': tag.untag,
	'listtags': tag.listTags,
	'viewconfig': base.viewConfig,
	'speak': misc.speak,
	'track': tracking.track,
	'update': tracking.trackUpdate,
	'listtracking': tracking.listTrackedItems,
	'stoptracking': tracking.stopTracking,
	'leaderboard': tracking.leaderboard
}

module.exports = commands;
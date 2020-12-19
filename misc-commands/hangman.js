const base = require('../base-commands/base');
const { getConfig } = require('../utils');
const fs = require('fs');

// Read in the dictionary
const dictionaryBuffer = fs.readFileSync('misc-files/dictionary.txt');
const dictionary = dictionaryBuffer.toString().split(/\r?\n/).filter(x => x.length);
const validWordLengths = new Set(dictionary.map(x => x.length).sort((a, b) => a - b));

// And all the reply templates
const asciiArtBuffer = fs.readFileSync('misc-files/hangmen.txt');
const asciiArt = asciiArtBuffer.toString().split(/\r?\næ\r?\n/).filter(x => x.trim().length);

function maxBigInt(...values) {
	let max = 0n;
	for (const value of values) {
		if (value > max) {
			max = value;
		}
	}

	return max;
}

function setCharAt(str, index, chr) {
    if(index > str.length - 1) return str;
    return str.substr(0, index) + chr + str.substr(index + 1);
}

class EvilHangmanGame {
	lastInteract = new Date();

	guessedLetters = new Set();
	lastBitmap = 0;

	words;
	wordLength;
	remainingGuesses;
	totalGuesses;
	currentWord;


	static countSetBits(number) {
		let count = 0n;
		while (number > 0n) {
			count += 1n;
			number &= number - 1n;
		}

		return count;
	}

	getExclusionGroup(character) {
		const wordMap = new Map();

		const unmapCount = new Map();
		const getCountFromWord = set => unmapCount.get(set.values().next().value)

		const unmapBitmap = new Map();
		const getBitmapFromWord = set => unmapBitmap.get(set.values().next().value)

		for (const word of this.words) {
			let count = 0;
			let key = 0n;
			for (let i = 0; i < word.length; ++i) {
				if (word.charAt(i) === character) {
					key |= 1n << BigInt(i);
					count += 1;
				}
			}

			if (!wordMap.has(key)) {
				wordMap.set(key, new Set());
			}

			wordMap.get(key).add(word);
			unmapBitmap.set(word, key);
			unmapCount.set(word, count);
		}

		let groups = Array.from(wordMap.values());

		// Check if there is a group with the most amount of words
		const maxWordCount = Math.max(...groups.map(x => x.size));
		groups.filter(x => x.size === maxWordCount);

		let wordList;
		if (groups.length > 1) {
			// There are multiple groups with the max number of words, choose the one with the least amount of the guessed letter
			const minLetterCount = Math.min(...groups.map(getCountFromWord));
			groups = groups.filter(x => getCountFromWord(x) === minLetterCount);

			if (groups.length > 1) {
				// There are multiple with the same letter count, pick the one with the most right-aligned letters
				const maxKey = maxBigInt(...groups.map(getBitmapFromWord));

				wordList = wordMap.get(maxKey);
				this.lastBitmap = maxKey;
			} else {
				wordList = groups[0];
				this.lastBitmap = getBitmapFromWord(groups[0]);
			}
		} else {
			wordList = groups[0];
			this.lastBitmap = getBitmapFromWord(groups[0]);
		}

		return wordList;
	}

	constructor(wordLength, guesses) {
		this.wordLength = wordLength;
		this.currentWord = ('-').repeat(wordLength);
		this.totalGuesses = this.remainingGuesses = guesses;

		this.words = new Set(dictionary.filter(x => x.length === wordLength));
	}

	renderState(user) {
		this.lastInteract = new Date();

		let state = Math.ceil((asciiArt.length - 1) * ((this.totalGuesses - this.remainingGuesses) / this.totalGuesses));
		if (state == asciiArt.length - 1 && this.remainingGuesses > 0) {
			state -= 1;
		}

		let result = asciiArt[state];
		result = result.replace('$g', `You have ${this.remainingGuesses} ${this.remainingGuesses != 1 ? 'guesses' : 'guess'} left`);
		result = result.replace('$u', `Used Letters: ${Array.from(this.guessedLetters).sort().join(' ')}`);
		result = result.replace('$w', `Word: ${this.currentWord}`);

		result = result.replace('$r', `Reply with: !guess <letter>`);

		return result;
	}

	makeGuess(character) {
		this.lastInteract = new Date();

		const newWordList = this.getExclusionGroup(character);

		if (this.lastBitmap != 0) {
			// They made a correct guess
			for (let i = 0; this.lastBitmap != 0; ++i) {
				const value = this.lastBitmap & (1n << BigInt(i));
				if (value != 0) {
					this.lastBitmap ^= value;
					this.currentWord = setCharAt(this.currentWord, i, character);
				}
			}
		} else {
			this.remainingGuesses -= 1;
		}

		this.guessedLetters.add(character);
		this.words = newWordList;

		return this.renderState();
	}
}


const hsetMap = new Map();
class NoResponseException {}

const hset = async (context) => {
	let receivedMessage = context.message;
	const author = receivedMessage.author.id;
	const promise = hsetMap.get(author);
	if (promise) {
		promise.resolve(receivedMessage);
		hsetMap.delete(author);
	}
}

function setHMap(receivedMessage, value) {
	const author = receivedMessage.author.id;
	const promise = hsetMap.get(author);
	if (promise) {
		promise.reject(new NoResponseException());
		hsetMap.delete(author);
	}

	hsetMap.set(author, value);
}

async function getClarification(receivedMessage, acceptFn, beginMessage, rejectMessage, config) {
	await receivedMessage.reply(beginMessage);

	for (let i = 0; i < config.retryCount; ++i) {
		const message = await new Promise((resolve, reject) => setHMap(receivedMessage, {resolve, reject}));

		if (acceptFn(message)) {
			return message;
		} else if (i != config.retryCount - 1) {
			receivedMessage.channel.send(rejectMessage);
		}
	}

	// We haven't returned so we've run out of tries.
	receivedMessage.reply('Too many wrong replies, aborting.');
	throw new NoResponseException();
}

function getInt(msg) {
	const x = msg.content.match(/\d+/);
	if (x && x[0]) {
		return parseInt(x[0]);
	}

	return NaN;
}

function randomInt(min, max) {
	return Math.round(Math.random() * (max - min) + min);
}

const activeGames = new Map();

const hangman = async (context) => {
	let receivedMessage = context.message;
	const config = getConfig(context.message.guild.id, context.nosql)
	let args = context.args;
	try {
		let currentGame = activeGames.get(receivedMessage.channel.id);
		if (currentGame) {
			if ((new Date()) - currentGame.lastInteract > config.hangmanTimeout) {
				// It's been long enough to just start a new game regardless of the old one.
				activeGames.delete(receivedMessage.channel.id);
			} else {
				receivedMessage.reply(`${client.emojis.cache.get('625182760494956544')} This channel already has an active game going...`);
				return;
			}
		}

		let wordLength;
		let guesses;
		if (args[0] === 'custom') {
			const wordLengthMsg = await getClarification(receivedMessage,
				msg => validWordLengths.has(getInt(msg)),
				`How long of a word do you want? (!hset [${Math.min(...validWordLengths)}-${Math.max(...validWordLengths)}])`,
				`Sorry, I don't have any words of that length ${client.emojis.cache.get('626104347813740586')}\nTry giving me a valid length.`,
				config);

			const guessesMsg = await getClarification(receivedMessage,
				msg => {
					const n = getInt(msg);
					return n > 0 && n < 26;
				},
				`How many guesses do you want? (!hset [1-25])`,
				`That's not within the range [1-25].\nTry giving me a valid count.`,
				config);

			wordLength = getInt(wordLengthMsg);
			guesses = getInt(guessesMsg);
		} else {
			do {
				wordLength = randomInt(Math.min(...validWordLengths), Math.max(...validWordLengths));
				guesses = Math.max(wordLength, Math.min(Math.round(wordLength * 1.5), randomInt(5, 20)));
				guesses = Math.min(guesses, 12);
				guesses = Math.max(guesses, Math.round(wordLength / 3) + 4);
			} while (dictionary.filter(x => x.length === wordLength).length === 0);
		}

		if (wordLength <= 7 && guesses <= 8) { // arbitrary numbers
			guesses = Math.max(4, wordLength - 2) + 8;
		}
		else if (wordLength >= 10 && guesses >= 12) {
			guesses = Math.round(wordLength / 2) + 3;
		}

		const newGame = new EvilHangmanGame(wordLength, guesses);
		activeGames.set(receivedMessage.channel.id, newGame);
		receivedMessage.channel.send('```' + newGame.renderState() + '```');
	} catch (err) {
		if (err instanceof NoResponseException) { /* Should have already been handled by the time we get here */ }
		else {
			base.sendError(receivedMessage, err);
		}
	} finally {
		if (receivedMessage.deletable) {
			await receivedMessage.delete();
		}
	}
}

const guess = async (context) => {
	let receivedMessage = context.message;
	let args = context.args;
	try {
		let currentGame = activeGames.get(receivedMessage.channel.id);
		if (!currentGame) {
			return receivedMessage.reply(`${client.emojis.cache.get('625182760494956544')} You need to start a game first...`);
		}

		if (!args[0]) {
			return receivedMessage.reply('I need a letter to guess with.');
		}

		if (args[0] == 'pardonthevictim') {
			activeGames.delete(receivedMessage.channel.id);
			await receivedMessage.channel.send("Game ended.");
			receivedMessage.delete();
			return;
		}

		if (args[0].length !== 1) {
			return receivedMessage.reply('Only 1 letter please! (e.g `!guess x`)');
		}

		if (currentGame.guessedLetters.has(args[0])) {
			return receivedMessage.reply(`That letter has already been guessed. ${client.emojis.cache.get('623553767467384832') || ''}`);
		}

		currentGame.makeGuess(args[0]);
		let replyMessage = '```' + currentGame.renderState() + '```';


		if (currentGame.currentWord.indexOf('-') === -1) {
			// They won???
			activeGames.delete(receivedMessage.channel.id);

			replyMessage += `**CONGRATULATIONS!** You actually somehow got the word!`;
		} else if (currentGame.remainingGuesses === 0) {
			activeGames.delete(receivedMessage.channel.id);

			const possibleWords = Array.from(currentGame.words);
			replyMessage += `**GAME OVER!** The word was: _${possibleWords[randomInt(1, possibleWords.length) - 1]}_.`;
		}

		await receivedMessage.channel.send(replyMessage);
	} catch (err) {
		base.sendError(receivedMessage, err);
	}
}

module.exports = {
	hangman,
	hset,
	guess
};

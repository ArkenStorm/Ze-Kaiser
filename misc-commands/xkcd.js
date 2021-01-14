const querystring = require('querystring');
const base = require('../base-commands/base');
const axios = require('axios').default;

async function getXkcdComicInfo(num, context) {
	if (num !== '') {
		num = parseInt(num);
	}
	const response = await axios.get(`https://xkcd.com/${num}/info.0.json`);
	if (response.status !== 200) {
		// send error
		base.sendError(
			context,
			`Failed to get comic #${num}\n${response.status}: ${response.statusText}`
		);
		return;
	}
	return response.data;
}

async function xkcd(context) {
	const { message, args } = context;
	const requestedComic = (args[0] || '').trim();
	let num;
	message.delete();
	if (!requestedComic) {
		// latest. It works
		num = '';
	} else if (/^\d+$/.test(requestedComic) && args.length === 1) {
		num = parseInt(requestedComic);
	} else if (requestedComic === 'random' && args.length === 1) {
		const latest = await getXkcdComicInfo('', context);
		num = Math.floor(Math.random() * (latest.num + 1));
	} else {
		// first search titles, then text, the scrape the search page
		const searchFuncs = [
			(terms) => xkcdApiSearch(terms, 'title'),
			(terms) => xkcdApiSearch(terms, 'text'),
			xkcdScrapeSearch
		];
		for (const searchFunc of searchFuncs) {
			const result = await searchFunc(args);
			if (result == null) {
				continue;
			} else if (Number.isInteger(result)) {
				num = result;
				break;
			} else {
				base.sendError(context, result.toString());
				return;
			}
		}
		if (!num) {
			message.channel.send('No results');
			return;
		}
	}
	if (num === 404) {
		message.channel.send('Error 404: comic not found');
		return;
	}
	const comic = await getXkcdComicInfo(num, context);

	const comicEmbed = new Discord.MessageEmbed()
		.setColor('#1A73E8')
		.setTitle(`xkcd #${comic.num}: ${comic.title}`)
		.setDescription(`Posted on ${comic.month}/${comic.day}/${comic.year}`)
		.setImage(comic.img)
		.setURL(`https://xkcd.com/${num}`)
		.setFooter(comic.alt);
	message.channel.send(comicEmbed);
}

async function xkcdScrapeSearch(args) {
	if (!args || args.length === 0) {
		return;
	}
	const terms = args
		.map((a) => a.trim())
		.filter(Boolean)
		.join('+');
	const url =
		'https://www.explainxkcd.com/wiki/index.php?' +
		querystring.stringify({
			search: terms,
			title: 'Special:Search',
			printable: 'yes'
		});
	const response = await axios.get(url);
	if (response.status !== 200) {
		// send error
		return `Failed to search explainxkcd.com for ${terms} #${num}\n${response.status}: ${response.statusText}`;
	}
	if (/There were no results matching the query/.test(response.data)) {
		return;
	}
	let selector;
	if (/mw-search-results/.test(response.data)) {
		// direct comic page
		selector = 'mw-search-results';
	} else {
		// search results page
		selector = `<h1 id="firstHeading" class="firstHeading" lang="en">`;
	}
	const htmlToSearch = (response.data.split(selector) || [])[1];
	if (!htmlToSearch) {
		return;
	}
	const num = (htmlToSearch.match(/\d+(?=:)/) || [])[0];
	if (!num) {
		return;
	}
	return parseInt(num);
}

async function xkcdApiSearch(args, whatToSearch) {
	if (!args || args.length === 0) {
		return;
	}
	const terms = args
		.map((a) => a.trim())
		.filter(Boolean)
		.join('+');
	const url =
		'https://www.explainxkcd.com/wiki/api.php?' +
		querystring.stringify({
			action: 'query',
			format: 'json',
			generator: 'search',
			gsrnamespace: 0,
			gsrlimit: 1,
			gsrwhat: whatToSearch ?? 'text',
			gsrsearch: terms
		});

	const response = await axios.get(url);
	if (response.status !== 200) {
		// send error
		return `Failed to search explainxkcd.com for ${terms} #${num}\n${response.status}: ${response.statusText}`;
	}
	if (!response.data?.query?.pages) {
		return;
	}
	const title = Object.values(response.data.query.pages)?.[0]?.title;
	if (!title) {
		return;
	}
	const num = /\d+(?=:)/.exec(title)?.[0];
	if (!num) {
		return;
	}
	return parseInt(num);
}

module.exports = { xkcd };

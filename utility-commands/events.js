const sqlite = require('../database/sqlite');
const moment = require('moment');

const event = (context) => {
	let eventParams = context.args.join(" ");
	const nameRegex = /"(.*?[^\\])"/g;
	let paramMatches = [...eventParams.matchAll(nameRegex)];

	const removals = paramMatches.map(m => m[0]);
	removals.forEach(r => eventParams = eventParams.replace(r, "")); // remove the matches from the args
	let args = eventParams.trim().toLowerCase().split(" ");

	let command;
	const results = paramMatches.map(m => m[1]);
	if (!results.length) { // no event/task ID is given
		command = initializers[args[0]];
	}
	else {
		if (/listjobs|jobs|joblist|tasks|assignments/.test(args[0])) {
			command = detailers['tasklist'];
		}
		else if(/task|job|assignment/.test(args[1])) {
			command = detailers['task' + args[0]];
		}
		else {
			command = detailers[args[0]];
		}
	}

	context.matches = results;
	if (command) {
		command(context); // refactor to be a promise so that errors can be caught? or just try/catch?
	}
	else {
		context.message.channel.send("Event command not recognized, refer to the help embed for syntax:");
		help(context);
	}
}

const help = (context) => {
	//note: the help.json will not be accurate until this is all complete, the commands will be slightly different for the dev version
	let allCommands = require('./eventHelp.json');

	let helpEmbed = new Discord.MessageEmbed().setColor('#2295d4');
	Object.keys(allCommands).forEach(command => {
		const currentCommand = allCommands[command];
		helpEmbed.addField(currentCommand.title, currentCommand.description);
	});
	helpEmbed.setFooter("Names of Events and Assignments **MUST** be wrapped in quotation marks for the commands to work correctly!");
	context.message.channel.send(helpEmbed);
}

const createEvent = async (context) => {
	let eventData = {
		server_id: context.message.channel.guild.id,
		title: "",
		start_date_time: "",
		end_date_time: "",
		description: "",
		creator: context.message.author.id
	}
	let canceled = false;
	let titleCorrect = false;
	let startTimeCorrect = false;
	let endTimeCorrect = false;
	let descriptionCorrect = false;

	let initialPrompt = await context.message.author.send("Let the event creation....BEGIN!");
	let dm = initialPrompt.channel;

	while (!(titleCorrect && startTimeCorrect && endTimeCorrect && descriptionCorrect)) {
		if (!titleCorrect) {
			await dm.send("What should the name of the event be?");
			await dm.awaitMessages(m => m, {max: 1, time: 60000, errors: ['time']})
			.then(collected => {
				if (collected.first().content.toLowerCase() === "cancel") return canceled = true;
				eventData.title = collected.first().content;
				titleCorrect = true;
			})
			.catch(collected => {
				dm.send("You took too long to respond (>60 seconds), try `!event create` again in the place where you originally typed it.");
				canceled = true;
			});
			if (canceled) {
				return dm.send("Event creation canceled.");
			}
		}

		if (!startTimeCorrect) {
			await dm.send("What is the START date/time? Please enter date in the following format: MM/DD/YYYY H:MM A\n(Example: `01/01/2000 8:30 PM`)");
			await dm.awaitMessages(m => m, {max: 1, time: 60000, errors: ['time']})
			.then(collected => {
				if (collected.first().content.toLowerCase() === "cancel") return canceled = true;
				let momentFailed = false;
				try {
					eventData.start_date_time = moment(collected.first().content.trim(), "MM/DD/YYYY h:mm a"); // need error handling
				} catch (error) {
					console.log(error);
					momentFailed = true;
				}
				if (!eventData.start_date_time.isValid()) momentFailed = true;
				startTimeCorrect = !momentFailed;
			})
			.catch(collected => {
				dm.send("You took too long to respond (>60 seconds), try `!event create` again in the place where you originally typed it.");
				canceled = true;
			});
			if (canceled) {
				return dm.send("Event creation canceled.");
			}
		}

		if (!endTimeCorrect) {
			await dm.send("What is the estimated END date/time? Please enter date in the following format: MM/DD/YYYY H:MM A\n(Example: `01/01/2000 8:30 PM`)");
			await dm.awaitMessages(m => m, {max: 1, time: 60000, errors: ['time']})
			.then(collected => {
				if (collected.first().content.toLowerCase() === "cancel") return canceled = true;
				let momentFailed = false;
				try {
					eventData.end_date_time = moment(collected.first().content.trim(), "MM/DD/YYYY h:mm a"); // need error handling
				} catch(error) {
					console.log("other separate");
					console.log(error);
					momentFailed = true;
				}
				if (!eventData.end_date_time.isValid()) momentFailed = true;
				endTimeCorrect = !momentFailed;
			})
			.catch(collected => {
				dm.send("You took too long to respond (>60 seconds), try `!event create` again in the place where you originally typed it.");
				canceled = true;
			});
			if (canceled) {
				return dm.send("Event creation canceled.");
			}
		}

		if (!descriptionCorrect) {
			await dm.send("How would you describe the event?");
			await dm.awaitMessages(m => m, {max: 1, time: 120000, errors: ['time']})
			.then(collected => {
				if (collected.first().content.toLowerCase() === "cancel") return canceled = true;
				eventData.description = collected.first().content;
				descriptionCorrect = true;
			})
			.catch(collected => {
				dm.send("You took too long to respond (>120 seconds), try `!event create` again in the place where you originally typed it.");
				canceled = true;
			});
			if (canceled) {
				return dm.send("Event creation canceled.");
			}
		}

		let eventEmbed = new Discord.MessageEmbed().setColor('#2295d4');
		eventEmbed.addField("Event Title:", eventData.title);
		eventEmbed.addField("Start Time:", eventData.start_date_time);
		eventEmbed.addField("Estimated End Time:", eventData.end_date_time);
		eventEmbed.addField("Description:", eventData.description);
		const reactionFilter = (reaction) => reaction.emoji.name === '1⃣' || reaction.emoji.name === '2⃣' || reaction.emoji.name === '3⃣' || reaction.emoji.name === '4⃣' || reaction.emoji.name === '❌';
		let embedMessage;

		dm.send(`This is how the event will be created currently. Is there anything you would like to change?\nIf so, react 1 for title, 2 for start time, 3 for end time, or 4 for description. Otherwise, react :x:.`);
		await dm.send(eventEmbed)
		.then(async message => {
			await message.react('1⃣');
			await message.react('2⃣');
			await message.react('3⃣');
			await message.react('4⃣');
			await message.react('❌');
			embedMessage = message;
		})
		await embedMessage.awaitReactions(reactionFilter, {max: 1, time: 60000, errors: ['time']})
		.then(collected => {
			if (collected.first().emoji.name === '1⃣') titleCorrect = false;
			else if (collected.first().emoji.name === '2⃣') startTimeCorrect = false;
			else if (collected.first().emoji.name === '3⃣') endTimeCorrect = false;
			else if (collected.first().emoji.name === '4⃣') descriptionCorrect = false;
			else dm.send("Event details confirmed; Event created.");
		})
		.catch(collected => {
			dm.send("Since you didn't react within 60 seconds, the event details were assumed correct and the event was created.");
		});
	}


	sqlite.events.insertEvent(context.db, eventData);
}

const listEvents = (context) => {
	sqlite.events.getAllEvents(context.db, context.message.guild.id).then(eventResults => {
		const toDisplay = eventResults.filter(response => response.server_id === context.message.channel.guild.id); // is this redundant? it seems redundant
		if(toDisplay.length) {
			let eventEmbed = new Discord.MessageEmbed().setColor('#2295d4')
				.setTitle(`Events scheduled for ${context.message.guild.name}`);
			toDisplay.forEach(row => {
				eventEmbed.addField(row.title, `ID: ${row.event_id}`);
			});
			context.message.channel.send(eventEmbed);
		}
		else {
			context.message.channel.send("Ha, and you thought you had events...");
		}

	}).catch(err => {
		console.log(err);
		context.message.channel.send("Well I tried...");
	})
}

const joinEvent = (context) => {
	const eventID = context.matches[0] || 1;
	const attendeeData = {
		user_id: context.message.author.id,
		event_id: eventID
	}
	sqlite.events.insertAttendee(context.db, attendeeData).then(res => {
		context.message.channel.send("You are now marked as attending the event.");
	})

}

const assign = (context) => {
	const assignmentID = context.matches[0] || 1;
	for(const userID of context.message.mentions.users.keyArray()) {
		const assigneeData = {
			user_id: userID,
			assignment_id: assignmentID,
			has_accepted: 0
		}
		sqlite.events.insertAssignee(context.db, assigneeData)
	}
	if (context.args[1].toLowerCase() == 'me') {
		sqlite.events.insertAssignee(context.db, {user_id: context.message.author.id, assignment_id: assignmentID, has_accepted: 0});
	}
	// check if already assigned, check if sqlite failed to add
	context.message.channel.send("They have now been assigned; remember, they still have to accept their assignment!");
}

const createTask = async (context) => {
	const eventId = context.matches[0] || 1;
	const taskData = {
		event_id: eventId,
		description: "Do all the things!!!"
	}
	await context.message.channel.send("What is the task?");
	await context.message.channel.awaitMessages(m => m.author.id == context.message.author.id, {max: 1, time: 60000, errors: ['time']})
	.then(collected => {
		taskData.description = collected.first().content;
	});
	sqlite.events.insertAssignment(context.db, taskData).then(res => {
		context.message.channel.send("The task has been created.");
	});
}

const editTask = (context) => {
	context.message.channel.send("Consider the task edited. (This isn't implemented yet)");
}

const listTasks = (context) => {
	const event_id = context.matches[0] || "1";
	sqlite.events.getEvent(context.db, event_id, context.message.channel.guild.id).then((eventResult) => {
		const list = sqlite.events.getAssignmentsForEvent(context.db, event_id).then((assignmentResults) => {
			const eventToDisplay = eventResult;
			const toDisplay = assignmentResults;

			let message = "";
			if(toDisplay.length) {
				message += `Id: ${event_id}\nEvent: ${eventToDisplay.title}\n`;

				toDisplay.forEach(row => {
					message += `assignment_id: ${row.assignment_id}\ndescription: ${row.description}\n\n`;
				})
				context.message.channel.send(message);
			}
			else {
				context.message.channel.send("Ha, and you thought you had jobs...");
			}

		}).catch(err => {
			console.log(err);
			context.message.channel.send("Well I tried...");
		});
	}).catch(err => {
		console.log(err);
		context.message.channel.send("Well I tried...");
	});
}

const editEvent = (context) => {
	context.message.channel.send("Consider the event edited. (This isn't implemented yet)");
}

const removeEvent = (context) => {
	// check creator id and and only allow delete if creator or admin
	sqlite.events.deleteEvent(context.db, context.matches[0]);
	context.message.channel.send("Event ~~destroyed~~ removed with great prejudice.");
}

const listAttendees = async (context) => {
	const event_id = context.matches[0];
	sqlite.events.getEvent(context.db, event_id, context.message.channel.guild.id).then(async eventResult => {
		const list = sqlite.events.getAttendeesForEvent(context.db, event_id).then(async attendeeResults => {
			const eventToDisplay = eventResult;
			const toDisplay = attendeeResults;

			if(toDisplay.length) {
				let attendeeEmbed = new Discord.MessageEmbed().setColor('#2295d4')
					.setTitle(`Attendees for ${eventToDisplay.title}`);
				toDisplay.forEach(row => {
					// fetch users so we can see their name
					const user = client.users.cache.get(row.user_id);
					if (user) {
						attendeeEmbed.addField("User:", user.username);
					}
					else {
						attendeeEmbed.addField("User ID:", row.user_id);
					}
				});
				await context.message.channel.send(attendeeEmbed);
			}
			else {
				await context.message.channel.send("Ha, and you thought you had attendees...");
			}

		}).catch(err => {
			console.log(err)
			context.message.channel.send("Well I tried...");
		});
	}).catch(err => {
		console.log(err)
		context.message.channel.send("Well I tried...");
	});
}

const listAssignees = async (context) => {
	// this should probably be limited to only events from the server where the command is given
	const assignment_id = context.matches[0];
	const assignment = await sqlite.events.getAssignment(context.db, assignment_id, context.message.guild.id);
	if (!assignment) {
		return await context.message.channel.send("No assignment was found with that ID");
	}
	sqlite.events.getAssigneesForAssignment(context.db, assignment_id, context.message.guild.id).then(assigneeResults => {
		const toDisplay = assigneeResults;

		if(toDisplay.length) {
			let assigneeEmbed = new Discord.MessageEmbed().setColor('#2295d4')
				.setTitle(`People assigned to: ${assignment.description}`);
			toDisplay.forEach(row => {
				// fetch users so we can get their names
				const user = client.users.cache.get(row.user_id);
				if (user) {
					assigneeEmbed.addField("User:", user.username);
				}
				else {
					assigneeEmbed.addField("User ID:", row.user_id);
				}
			});
			context.message.channel.send(assigneeEmbed);
		}
		else {
			context.message.channel.send("Ha, and you thought you had assignees...");
		}

	}).catch(err => {
		console.log(err);
		context.message.channel.send("Well I tried...");
	});
}

const displayEventInfo = (context) => {
	const event_id = context.matches[0];
	sqlite.events.getEvent(context.db, event_id, context.message.guild.id).then(eventResult => {
		let eventEmbed = new Discord.MessageEmbed().setColor('#2295d4')
			.setTitle(eventResult.title)
			.addField("ID:", eventResult.event_id)
			.addField("Description:", eventResult.description)
			.addField("Start Time:", eventResult.start_date_time, true)
			.addField("End Time:", eventResult.end_date_time, true);
		context.message.channel.send(eventEmbed);
	}).catch(err => {
		console.log(err);
		context.message.channel.send("No event found with that ID.");
	});
}

const initializers = {
	'help': help,
	'create': createEvent,
	'list': listEvents
}

const detailers = {
	'join': joinEvent,
	'listattendees': listAttendees,
	'listassignees': listAssignees,
	'assign': assign,
	'taskcreate': createTask,
	'taskedit': editTask,
	'tasklist': listTasks,
	'edit': editEvent,
	'delete': removeEvent,
	'info': displayEventInfo
}

module.exports = {
	event
}
/**
 * Functions about the event tables
 */


const sqlite = require('./sqlite');

/*
eventData
{
    event_id: "",
    server_id: "",
    title: "",
    start_date_time: "2000-01-01T00:00:00",
    end_date_time: "2000-01-01T00:00:00",
    description: "",
    size: "",
    creator: "",
    reminder_date_time: "2000-01-01T00:00:00",
    repeat_id: ""
}
*/
const insertEvent = (db, eventData) => {
	return sqlite.run(db, 'INSERT INTO Event(server_id, title, start_date_time, end_date_time, description, size, creator, reminder_date_time, repeat_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
        eventData.server_id,
        eventData.title,
        eventData.start_date_time,
        eventData.end_date_time,
        eventData.description,
        eventData.size,
        eventData.creator,
        eventData.reminder_date_time,
        eventData.repeat_id
    ]);
}

const getEvent = async (db, event_id, server_id) => {
    const result = await sqlite.getSingleRow(db, 'SELECT * FROM Event WHERE event_id = ? AND server_id = ?', [event_id, server_id]);

    if (result == undefined) {
        return null;
    }

    // afaik this should return the below just as is
    //   but I left the bottom part just in case
    return result;

    // return {
    //     event_id: result.event_id,
    //     title: result.title,
    //     start_date_time: result.start_date_time,
    //     end_date_time: result.end_date_time,
    //     description: result.description,
    //     size: result.size,
    //     creator: result.creator,
    //     reminder_date_time: result.reminder_date_time,
    //     repeat_id: result.repeat_id
    // }
};

const getAllEvents = async (db, server_id) => {
    const results = await sqlite.getAllRows(db, 'SELECT * FROM Event WHERE server_id = ?', [server_id]);
    return results;
};

// updateData just needs to be a object with only the columns that need
//  to be updated for that event
const updateEvent = (db, event_id, updateData) => {
    var sql = 'UPDATE Event SET ';
    for (let property in updateData) {
        if(updateData.hasOwnProperty(property)){
            sql += `${property} = ${updateData[property]}, `;
        }
    }
    sql += `WHERE event_id = ${event_id};`;
    return sqlite.run(db, sql);
};

const deleteEvent = (db, event_id) => {
    // definitely gonna need to do some admin checks on this one
    // remove associated tasks as well
    return sqlite.run(db, 'DELETE FROM Event WHERE event_id = ?', [event_id]);
}

/*
attendeeData
{
    user_id: "",
    event_id: ""
}
*/
const insertAttendee = (db, attendeeData) => {
    return sqlite.run(db, 'INSERT INTO Attendee(user_id, event_id) VALUES (?, ?)', [
            attendeeData.user_id,
            attendeeData.event_id
        ]);
};

const getAttendeesForEvent = async (db, event_id) => {
    const results = await sqlite.getAllRows(db, 'SELECT * from Attendee WHERE event_id = ?', [event_id]);
    return results;
}

const deleteAttendee = (db, attendeeData) => {
    return Promise.all(
        run(db, 'DELETE FROM Attendee WHERE user_id = ? AND event_id = ?', [
            attendeeData.user_id,
            attendeeData.event_id
        ])
	);
}

/*
assignmentData
{
    assignment_id: "",
    event_id: "",
    description: ""
}
*/
const insertAssignment = (db, assignmentData) => {
    return (
        sqlite.run(db, 'INSERT INTO Assignment(assignment_id, event_id, description) VALUES (?, ?, ?)', [
            assignmentData.assignment_id,
            assignmentData.event_id,
            assignmentData.description
        ])
	);
}

const getAssignmentsForEvent = async (db, event_id) => {
    const results = await sqlite.getAllRows(db, 'SELECT * from Assignment WHERE event_id = ?', [event_id]);
    return results;
}

const getAssignment = async (db, assignment_id, server_id) => {
    const result = await sqlite.getSingleRow(db, 'SELECT * FROM Assignment WHERE assignment_id = ? AND server_id = ?', [assignment_id, server_id]);
    return result;
}

const deleteAssignment = (db, assignment_id) => {
    return Promise.all(
        run(db, 'DELETE FROM Event WHERE assignment_id = ?', [
            assignment_id
        ])
	);
}

/*
asigneeData
{
    user_id: "",
    assignment_id: "",
    has_accepted: false
}
*/
const insertAssignee = (db, asigneeData) => {
    return (
        sqlite.run(db, 'INSERT INTO Assignee(user_id, assignment_id, has_accepted) VALUES (?, ?, ?)', [
            asigneeData.user_id,
            asigneeData.assignment_id,
            asigneeData.has_accepted
        ])
	);
}

const getAssigneesForAssignment = async (db, assignment_id, server_id) => {
    const results = await sqlite.getAllRows(db, 'SELECT * from Assignee WHERE assignment_id = ?  AND server_id = ?', [assignment_id, server_id]);
    return results;
}

const deleteAssigneeFromAssignment = (db, assignment_id, user_id) => {
    return Promise.all(
        run(db, 'DELETE FROM Event WHERE assignment_id = ? AND user_id = ?', [
            assignment_id,
            user_id
        ])
	);
}

module.exports = {
    insertEvent,
    getEvent,
    getAllEvents,
    updateEvent,
    deleteEvent,

    insertAttendee,
    getAttendeesForEvent,
    deleteAttendee,

    insertAssignment,
    getAssignmentsForEvent,
    getAssignment,
    deleteAssignment,

    insertAssignee,
    getAssigneesForAssignment,
    deleteAssigneeFromAssignment
};
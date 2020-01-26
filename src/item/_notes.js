"use strict";

require('../libs.js');

function addNote(pmcData, body, sessionID) {
    pmcData.Notes.Notes.push({
		"Time": body.note.Time, 
		"Text": body.note.Text
	});
    return "OK";
}

function editNode(pmcData, body, sessionID) {
    pmcData.Notes.Notes[body.index] = {
		"Time": body.note.Time, 
		"Text": body.note.Text
	};
    return "OK";
}

function deleteNote(pmcData, body, sessionID) {
    pmcData.Notes.Notes.splice(body.index, 1);
    return "OK";
}

module.exports.addNote = addNote;
module.exports.editNode = editNode;
module.exports.deleteNote = deleteNote;
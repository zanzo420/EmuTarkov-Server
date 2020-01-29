"use strict";

require('../libs.js');

function saveOpenSessions() {
	account_f.accountServer.saveToDisk();
	events_f.scheduledEventHandler.saveToDisk();

	for (let sessionId of profile_f.profileServer.getOpenSessions()) {
		profile_f.profileServer.saveToDisk(sessionId);
		dialogue_f.dialogueServer.saveToDisk(sessionId);
	}
}

module.exports.saveOpenSessions = saveOpenSessions;
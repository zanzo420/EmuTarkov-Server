"use strict";

require('../libs.js');

function saveOpenSessions() {
	account_f.accountServer.saveToDisk();

	for (let sessionId of profile_f.profileServer.getOpenSessions()) {
		profile_f.profileServer.savePmcData(sessionId);
		profile_f.profileServer.saveScavData(sessionId);
	}

	for (let sessionId of trader_f.traderServer.getOpenSessions()) {
		trader_f.traderServer.saveToDisk(sessionId);
	}

	for (let sessionId of dialogue_f.dialogueServer.getOpenSessions()) {
		dialogue_f.dialogueServer.saveToDisk(sessionId);
	}

	logger.logSuccess("Player progress successfully saved to disk!");
}

module.exports.saveOpenSessions = saveOpenSessions;
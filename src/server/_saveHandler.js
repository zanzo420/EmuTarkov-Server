"use strict";

require('../libs.js');

function saveOpenSessions() {
	account_f.accountServer.saveToDisk();

	for (let sessionId of profile_f.profileServer.getOpenSessions()) {
		profile_f.profileServer.savePmcData(sessionId);
		profile_f.profileServer.saveScavData(sessionId);
		trader_f.traderServer.saveToDisk(sessionId);
		dialogue_f.dialogueServer.saveToDisk(sessionId);
	}

	logger.logSuccess("Player progress successfully saved to disk!");
}

module.exports.saveOpenSessions = saveOpenSessions;
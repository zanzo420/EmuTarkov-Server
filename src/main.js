"use strict";

// set stdout encoding
process.stdout.setEncoding('utf8');

// load application
require("./libs.js")(true, new Date());

// show server name in window
process.stdout.write(String.fromCharCode(27) + ']0;' + "JustEmuTarkov Server " + constants.serverVersion() + String.fromCharCode(7));
process.stdout.write('\u001B[2J\u001B[0;0f');

// oops all errors
process.on('uncaughtException', (error, promise) => {
    logger.logError("Server: " + constants.serverVersion());
    logger.logError("Game: " + ((constants.gameVersion() !== "") ? constants.gameVersion() : "Not Launched"));
    logger.logError("Trace:");
    logger.logData(error);
    logger.logInfo("Finished Dumping Error", "cyan");
});

if (settings.autosave.saveOnExit) {
	process.on('exit', (code) => {
		saveHandler.saveOpenSessions();
	});
	process.on('SIGINT', (code) => {
		saveHandler.saveOpenSessions();
	});
}

if (settings.autosave.saveIntervalSec > 0) {
	setInterval(function() {
		saveHandler.saveOpenSessions();
		logger.logSuccess("Player progress autosaved!");
	}, settings.autosave.saveIntervalSec * 1000);
}

// start application
server.start();
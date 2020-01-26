"use strict";

require('../libs.js');

/* TraderServer class maintains list of traders for each sessionID in memory. */
class TraderServer {
    constructor() {
        this.traders = {};
    }

    /* Load all the traders for sessionID into memory. */
    initializeTraders(sessionID) {
        this.traders[sessionID] = {};

        for (let fileId in filepaths.traders) {
            let traderData = json.parse(json.read(getPath(fileId, sessionID)));
            this.traders[sessionID][traderData._id] = traderData;
        }
    }

    saveToDisk(sessionID) {
        for (let traderId in this.traders[sessionID]) {
            json.write(getPath(traderId, sessionID), this.traders[sessionID][traderId]);
        }
    }

    getTrader(id, sessionID) {
        return {err: 0, errmsg: "", data: this.traders[sessionID][id]};
    }

    getAllTraders(sessionID) {
        let traders = [];

        for (let traderId in this.traders[sessionID]) {
            if (traderId === "ragfair") {
                continue;
            }
            traders.push(this.traders[sessionID][traderId]);
        }

        return {err: 0, errmsg: null, data: traders};
    }

    lvlUp(id, sessionID) {
        let pmcProfile = profile_f.profileServer.getPmcProfile(sessionID);
        let currentTrader = this.traders[sessionID][id];
        let loyaltyLevels = currentTrader.loyalty.loyaltyLevels;

        // level up player
        let checkedExp = 0;

        for (let level in globalSettings.data.config.exp.level.exp_table) {
            if (pmcProfile.Info.Experience < checkedExp) {
                break;
            }

            pmcProfile.Info.Level = level;
            checkedExp += globalSettings.data.config.exp.level.exp_table[level].exp;
        }

        // level up traders
        let targetLevel = 0;
        
        for (let level in loyaltyLevels) {
            // level reached
            if ((loyaltyLevels[level].minLevel <= pmcProfile.Info.Level
            && loyaltyLevels[level].minSalesSum <= currentTrader.loyalty.currentSalesSum
            && loyaltyLevels[level].minStanding <= currentTrader.loyalty.currentStanding)
            && targetLevel < 4) {
                targetLevel++;
                continue;
            }

            break;
        }

        currentTrader.loyalty.currentLevel = targetLevel;


        // set assort
        if (id !== "579dc571d53a0658a154fbec") {
            assort_f.generate(id, sessionID);
        }
    }
}

function getPath(id, sessionID) {
    let path = filepaths.user.profiles.traders[id];
    return path.replace("__REPLACEME__", sessionID);
}

module.exports.traderServer = new TraderServer();
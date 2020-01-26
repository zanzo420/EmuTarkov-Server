"use strict";

require('../libs.js');

/*
* TraderServer class maintains list of traders for each sessionID in memory. All first-time loads and save operations
* also write to disk.
*/
class TraderServer {
    constructor() {
        this.traders = {};
    }

    /* Load all the traders for sessionID into memory. */
    initializeTraders(sessionID) {
        this.traders[sessionID] = {};

        for (let fileId in filepaths.traders) {
            if (fileId === "ragfair") {
                continue;
            }
            let traderData = json.parse(json.read(getPath(fileId, sessionID)));
            this.traders[sessionID][traderData._id] = traderData;
        }
    }

    saveToDisk(sessionID) {
        for (let trader of this.traders) {
            json.write(getPath(trader._id, sessionID), trader);
        }
    }

    getTrader(id, sessionID) {
        return {err: 0, errmsg: "", data: this.traders[sessionID][id]};
    }

    getAllTraders(sessionID) {
        let traders = [];

        for (let trader of this.traders) {
            if (trader._id === "ragfair") {
                continue;
            }
            traders.push(trader);
        }
    }

    lvlUp(id, sessionID) {
        let pmcProfile = profile_f.profileServer.getPmcProfile(sessionID);
        let currentTrader = this.traders[sessionID][id];
        let loyaltyLevels = currentTrader.data.loyalty.loyaltyLevels;

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
            && loyaltyLevels[level].minSalesSum <= currentTrader.data.loyalty.currentSalesSum
            && loyaltyLevels[level].minStanding <= currentTrader.data.loyalty.currentStanding)
            && targetLevel < 4) {
                targetLevel++;
                continue;
            }

            break;
        }

        currentTrader.data.loyalty.currentLevel = targetLevel;


        // set assort
        if (id !== "579dc571d53a0658a154fbec") {
            assort_f.generate(id, sessionID);
        }
    }
}

module.exports.traderServer = new TraderServer();
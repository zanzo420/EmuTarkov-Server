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

    /* Load a single trader into memory. Used during profile generation. */
    initializeTrader(traderData, sessionID) {
        this.traders[sessionID] = {
            [traderData._id]: traderData
        };
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
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
        let loyaltyLevels = this.traders[sessionID][id].loyalty.loyaltyLevels;

        // level up player
        let checkedExp = 0;

        for (let level in globalSettings.data.config.exp.level.exp_table) {
            if (pmcData.Info.Experience < checkedExp) {
                break;
            }

            pmcData.Info.Level = level;
            checkedExp += globalSettings.data.config.exp.level.exp_table[level].exp;
        }

        // level up traders
        let targetLevel = 0;
        
        for (let level in loyaltyLevels) {
            // level reached
            if ((loyaltyLevels[level].minLevel <= pmcData.Info.Level
            && loyaltyLevels[level].minSalesSum <= pmcData.TraderStandings[id].currentSalesSum
            && loyaltyLevels[level].minStanding <= pmcData.TraderStandings[id].currentStanding)
            && targetLevel < 4) {
                targetLevel++;
                continue;
            }

            pmcData.TraderStandings[id].currentLevel = targetLevel;
            break;
        }

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
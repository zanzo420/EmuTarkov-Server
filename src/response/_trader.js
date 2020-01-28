"use strict";

require('../libs.js');

/* TraderServer class maintains list of traders for each sessionID in memory. */
class TraderServer {
    constructor() {
        this.traders = {};
    }

    /* Load all the traders for sessionID into memory. */
    initializeTraders(sessionID) {
        this.traders = {};

        for (let fileId in filepaths.traders) {
            let traderData = json.parse(json.read(filepaths.traders[fileId]));
            this.traders[traderData._id] = traderData;
        }
    }

    /* Load a single trader into memory. Used during profile generation. */
    initializeTrader(id, sessionID) {
        this.traders = {[id]: json.parse(json.read(filepaths.traders[id]))};
    }

    getTrader(id, sessionID) {
        return {err: 0, errmsg: "", data: this.traders[id]};
    }

    getAllTraders(sessionID) {
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
        let traders = [];

        for (let traderId in this.traders) {
            let trader = this.traders[traderId];

            if (traderId === "ragfair") {
                continue;
            }

            trader.loyalty.currentLevel = pmcData.TraderStandings[traderId].currentLevel;
            trader.loyalty.currentStanding = pmcData.TraderStandings[traderId].currentStanding;
            trader.loyalty.currentSalesSum = pmcData.TraderStandings[traderId].currentSalesSum;
            traders.push(trader);
        }

        return {err: 0, errmsg: null, data: traders};
    }

    lvlUp(id, sessionID) {
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
        let loyaltyLevels = this.traders[id].loyalty.loyaltyLevels;

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
            pmcData.TraderStandings[id].NextLoyalty = loyaltyLevels[level];
            break;
        }

        // set assort
        assort_f.generate(id, sessionID);
    }
}

module.exports.traderServer = new TraderServer();
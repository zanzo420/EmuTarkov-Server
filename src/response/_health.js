"use strict";

require("../libs.js");

/* HealthServer class maintains list of health for each sessionID in memory. */
class HealthServer {
    constructor() {
        this.healths = {};
    }

    initializeHealth(sessionID) {
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID);

        this.healths[sessionID] = {
            "Hydration": 0,
            "Energy": 0,
            "Head": pmcData.Health.BodyParts.Head.Health.Current,
            "Chest": pmcData.Health.BodyParts.Chest.Health.Current,
            "Stomach": pmcData.Health.BodyParts.Stomach.Health.Current,
            "LeftArm": pmcData.Health.BodyParts.LeftArm.Health.Current,
            "RightArm": pmcData.Health.BodyParts.RightArm.Health.Current,
            "LeftLeg": pmcData.Health.BodyParts.LeftLeg.Health.Current,
            "RightLeg": pmcData.Health.BodyParts.RightLeg.Health.Current
        };
    }

    /* stores the player health changes */
    updateHealth(info, sessionID) {
        let node = this.healths[sessionID];

        switch (info.type) {
            case "HydrationChanged":
            case "EnergyChanged":
                node[(info.type).replace("Changed", "")] += parseInt(info.diff);
                break;
    
            case "HealthChanged":
                node[info.item] = info.value;
                break;
    
            case "Died":
                node = {
                    "Hydration": this.healths[sessionID].Hydration,
                    "Energy": this.healths[sessionID].Energy,
                    "Head": 0,
                    "Chest": 0,
                    "Stomach": 0,
                    "LeftArm": 0,
                    "RightArm": 0,
                    "LeftLeg": 0,
                    "RightLeg": 0
                };
                break;
        }

        this.healths[sessionID] = node;
    }

    /* apply the health changes and delete stored ones */
    setHealth(pmcData, sessionID) {
        if (!settings.gameplay.inraid.saveHealthEnabled) {
            return;
        }

        let node = this.healths[sessionID];
        let keys = Object.keys(node);        

        for (let item of keys) {
            if (item !== "Hydration" && item !== "Energy") {
                pmcData.Health.BodyParts[item].Health.Current = (node[item] === 0) ? (pmcData.Health.BodyParts[item].Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node[item];
            } else {
                pmcData.Health[item].Current += node[item];
            }   
        }
    
        this.initializeHealth(sessionID);
    }
}

module.exports.healthServer = new HealthServer();
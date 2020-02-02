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
        if (!settings.gameplay.inraid.saveHealthEnabled) {
            return;
        }

        // update health to apply after raid
        let node = this.healths[sessionID];

        switch (info.type) {
            case "HydrationChanged":
            case "EnergyChanged":
                node[(info.type).replace("Changed", "")] += parseInt(info.diff);
                break;
    
            case "HealthChanged":
                node[info.bodyPart] = info.value;
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
        let health = pmcData.Health;
    
        health.Hydration.Current += node.Hydration;
        health.Energy.Current += node.Energy;
        health.BodyParts.Head.Health.Current = (node.Head === 0) ? (health.BodyParts.Head.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.Head;
        health.BodyParts.Chest.Health.Current = (node.Chest === 0) ? (health.BodyParts.Chest.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.Chest;
        health.BodyParts.Stomach.Health.Current = (node.Stomach === 0) ? (health.BodyParts.Stomach.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.Stomach;
        health.BodyParts.LeftArm.Health.Current = (node.LeftArm === 0) ? (health.BodyParts.LeftArm.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.LeftArm;
        health.BodyParts.RightArm.Health.Current = (node.RightArm === 0) ? (health.BodyParts.RightArm.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.RightArm;
        health.BodyParts.LeftLeg.Health.Current = (node.LeftLeg === 0) ? (health.BodyParts.LeftLeg.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.LeftLeg;
        health.BodyParts.RightLeg.Health.Current = (node.RightLeg === 0) ? (health.BodyParts.RightLeg.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.RightLeg;
    
        pmcData.Health = health;
        this.initializeHealth(sessionID);
    }
}

module.exports.healthServer = new HealthServer();
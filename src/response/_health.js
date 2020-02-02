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

        logger.logWarning("Data");
        logger.logData(this.healths);
    }

    /* stores the player health changes */
    updateHealth(info, sessionID) {
        if (!settings.gameplay.inraid.saveHealthEnabled) {
            return;
        }
    
        logger.logWarning("Data");
        logger.logData(this.healths);

        // update health to apply after raid
        let health = this.healths[sessionID];
    
        switch (info.type) {
            case "HydrationChanged":
                health["Hydration"] += parseInt(info.diff);
                break;
    
            case "EnergyChanged":
                health["Energy"] += parseInt(info.diff);
                break;
    
            case "HealthChanged":
                switch(info.bodyPart) {
                    case "Head": healths[sessionID].Head = parseInt(info.value); break;
                    case "Chest": healths[sessionID].Chest = parseInt(info.value); break;
                    case "Stomach": healths[sessionID].Stomach = parseInt(info.value); break;
                    case "LeftArm": healths[sessionID].LeftArm = parseInt(info.value); break;
                    case "RightArm": healths[sessionID].RightArm = parseInt(info.value); break;
                    case "LeftLeg": healths[sessionID].LeftLeg = parseInt(info.value); break;
                    case "RightLeg": healths[sessionID].RightLeg = parseInt(info.value); break;
                }
                break;
    
            case "Died":
                healths[sessionID].Head = 0;
                healths[sessionID].Chest = 0;
                healths[sessionID].Stomach = 0;
                healths[sessionID].LeftArm = 0;
                healths[sessionID].RightArm = 0;
                healths[sessionID].LeftLeg = 0;
                healths[sessionID].RightLeg = 0;
                break;
        }
    
        this.healths[sessionID] = health;
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
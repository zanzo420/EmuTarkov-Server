"use strict";

require("../libs.js");

let healths = {};

function markFoundItems(pmcData, offraidData, isPlayerScav) {
    // mark items found in raid
    for (let offraidItem of offraidData.Inventory.items) {
        let found = false;

        // mark new items for PMC, mark all items for scavs
        if (!isPlayerScav) {
            for (let item of pmcData.Inventory.items) {
                if (offraidItem._id === item._id) {
                    found = true;
                    break;
                }
            }

            if (found) {
                continue;
            }
        }

        // mark item found in raid
        if (offraidItem.hasOwnProperty("upd")) {
            offraidItem.upd["SpawnedInSession"] = true;
        } else {
            offraidItem["upd"] = {"SpawnedInSession": true};
        }
    }

    return offraidData;
}

function setInventory(pmcData, offraidData) {
    move_f.removeItemFromProfile(pmcData, pmcData.Inventory.equipment);
    move_f.removeItemFromProfile(pmcData, pmcData.Inventory.questRaidItems);
    move_f.removeItemFromProfile(pmcData, pmcData.Inventory.questStashItems);

    for (let item of offraidData.Inventory.items) {
        pmcData.Inventory.items.push(item);
    }

    return pmcData;
}

function deleteInventory(pmcData, sessionID) {
    let toDelete = [];

    for (let item of pmcData.Inventory.items) {
        if (item.parentId === pmcData.Inventory.equipment
            && item.slotId !== "SecuredContainer"
            && item.slotId !== "Scabbard"
            && item.slotId !== "Pockets") {
            toDelete.push(item._id);
        }

        // remove pocket insides
        if (item.slotId === "Pockets") {
            for (let pocket of pmcData.Inventory.items) {
                if (pocket.parentId === item._id) {
                    toDelete.push(pocket._id);
                }
            }
        }
    }

    // finally delete them
    for (let item of toDelete) {
        move_f.removeItemFromProfile(pmcData, item);
    }

    return pmcData;
}

function setHealth(pmcData, sessionID) {
    let node = healths[sessionID];
    let health = pmcData.Health;
    
    health.BodyParts.Head.Health.Current = (node.Head === 0) ? (health.BodyParts.Head.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.Head;
    health.BodyParts.Chest.Health.Current = (node.Chest === 0) ? (health.BodyParts.Chest.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.Chest;
    health.BodyParts.Stomach.Health.Current = (node.Stomach === 0) ? (health.BodyParts.Stomach.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.Head;
    health.BodyParts.LeftArm.Health.Current = (node.LeftArm === 0) ? (health.BodyParts.LeftArm.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.Head;
    health.BodyParts.RightArm.Health.Current = (node.RightArm === 0) ? (health.BodyParts.RightArm.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.Head;
    health.BodyParts.LeftLeg.Health.Current = (node.LeftLeg === 0) ? (health.BodyParts.LeftLeg.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.Head;
    health.BodyParts.RightLeg.Health.Current = (node.RightLeg === 0) ? (health.BodyParts.RightLeg.Health.Maximum * settings.gameplay.inraid.saveHealthMultiplier) : node.Head;

    pmcData.Health = health;
    delete healths[sessionID];
}

function saveProgress(offraidData, sessionID) {
    if (!settings.gameplay.inraid.saveLootEnabled) {
        return;
    }

    let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
    let scavData = profile_f.profileServer.getScavProfile(sessionID);
    const isPlayerScav = offraidData.isPlayerScav;
    const isDead = offraidData.exit !== "survived" && offraidData.exit !== "runner";

    // set pmc data
    if (!isPlayerScav) {
        pmcData.Info.Level = offraidData.profile.Info.Level;
        pmcData.Skills = offraidData.profile.Skills;
        pmcData.Stats = offraidData.profile.Stats;
        pmcData.Encyclopedia = offraidData.profile.Encyclopedia;
        pmcData.ConditionCounters = offraidData.profile.ConditionCounters;
        pmcData.Quests = offraidData.profile.Quests;

        // level 69 cap to prevent visual bug occuring at level 70
        if (pmcData.Info.Experience > 13129881) {
            pmcData.Info.Experience = 13129881;
        }

        // set player health now
        setHealth(pmcData, sessionID);
    }

    // Find insured items and filter out items still in inventory (if alive).
    let insuredItems = pmcData.InsuredItems;
    let retainedInsuranceItemIds = {};
    let traderToInsuredItems = {};

    // If character died, then want all the insured items on inventory.
    // Otherwise, only get insured items not in offraidProfile's inventory.
    if (!isDead) {
        for (let insuredIndex in insuredItems) {
            for (let item of offraidData.profile.Inventory.items) {
                if (item._id === insuredItems[insuredIndex].itemId) {
                    retainedInsuranceItemIds[item._id] = 1;
                }
            }
        }
    }

    // mark found items and replace item ID's
    offraidData.profile = markFoundItems(pmcData, offraidData.profile, isPlayerScav);
    offraidData.profile.Inventory.items = itm_hf.replaceIDs(offraidData.profile, offraidData.profile.Inventory.items);

    // set profile equipment to the raid equipment
    if (isPlayerScav) {
        scavData = setInventory(scavData, offraidData.profile);
    } else {
        for (let insuredIndex in insuredItems) {
            for (let item of pmcData.Inventory.items) {
                if (item._id === insuredItems[insuredIndex].itemId && !(item._id in retainedInsuranceItemIds)) {
                    const traderId = insuredItems[insuredIndex].tid;
                    traderToInsuredItems[traderId] = traderToInsuredItems[traderId] || [];
                    traderToInsuredItems[traderId].push(item);
                    insurance_f.remove(pmcData, item._id, sessionID);
                }
            }
        }

        pmcData = setInventory(pmcData, offraidData.profile);
    }

    // terminate early for player scavs because we don't care about whether they died.
    if (isPlayerScav) {
        return;
    }

    // remove inventory if player died
    if (isDead) {
        pmcData = deleteInventory(pmcData, sessionID);
    }

    // Send insurance message to player.
    // TODO(camo1018): Send insuranceExpired/Complete messages.
    // TODO(camo1018): Pretty sure items are messed up. Investigate and fix.
    for (let traderId in traderToInsuredItems) {
        let trader = trader_f.traderServer.getTrader(traderId);
        let dialogueTemplates = json.parse(json.read(filepaths.dialogues[traderId]));

        let messageContent = {
            templateId: dialogueTemplates.insuranceStart[utility.getRandomInt(0, 
                                                        dialogueTemplates.insuranceStart.length - 1)],
            type: dialogue_f.getMessageTypeValue("npcTrader")
        };
        dialogue_f.dialogueServer.addDialogueMessage(traderId, messageContent, sessionID);
    
        messageContent = {
            templateId: dialogueTemplates.insuranceFound[utility.getRandomInt(0, 
                                                        dialogueTemplates.insuranceFound.length - 1)],
            type: dialogue_f.getMessageTypeValue("insuranceReturn"),
            maxStorageTime: trader.data.insurance.max_storage_time * 3600,
            systemData: {
                date: utility.getDate(),
                time: utility.getTime(),
                location: pmcData.Info.EEntryPoint
            }
        };
        events_f.scheduledEventHandler.addToSchedule({
            type: "insuranceReturn",
            sessionId: sessionID,
            scheduledTime: Date.now() + utility.getRandomInt(trader.data.insurance.min_return_hour * 3600,
                                                             trader.data.insurance.max_return_hour * 3600) * 1000,
            data: {
                traderId: traderId,
                messageContent: messageContent,
                items: traderToInsuredItems[traderId]
            }
        });        
    }
}

// TODO: apofis please give me char id with it so scav damage and energy won't be applied
function updateHealth(info, sessionID) {
    if (!settings.gameplay.inraid.saveHealthEnabled) {
        return;
    }

    let pmcData = profile_f.profileServer.getPmcProfile(sessionID);

    if (typeof healths[sessionID] === "undefined") {
        healths[sessionID] = {
            "Head": pmcData.Health.BodyParts.Head.Health.Maximum,
            "Chest": pmcData.Health.BodyParts.Chest.Health.Maximum,
            "Stomach": pmcData.Health.BodyParts.Stomach.Health.Maximum,
            "LeftArm": pmcData.Health.BodyParts.LeftArm.Health.Maximum,
            "RightArm": pmcData.Health.BodyParts.RightArm.Health.Maximum,
            "LeftLeg": pmcData.Health.BodyParts.LeftLeg.Health.Maximum,
            "RightLeg": pmcData.Health.BodyParts.RightLeg.Health.Maximum
        };
    }

    switch (info.type) {
        case "HydrationChanged":
            console.log("Hydration");
            console.log(info.value);
            //pmcData.Health.Hydration.Current += (pmcData.Health.Hydration.Current > pmcData.Health.Hydration.Maximum) ? 0 : parseInt(info.value);
            break;

        case "EnergyChanged":
                console.log("Energy");
            console.log(info.value);
            //pmcData.Health.Energy.Current += (pmcData.Health.Energy.Current > pmcData.Health.Energy.Maximum) ? 0 : parseInt(info.value);
            break;

        case "HealthChanged":
            let health = healths[sessionID];
            health[info.bodyPart] = parseInt(info.value);
            healths[sessionID] = health;
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

    logger.logData(info);
}

module.exports.saveProgress = saveProgress;
module.exports.updateHealth = updateHealth;
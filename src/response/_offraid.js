"use strict";

require("../libs.js");

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

function removeHealth(pmcData) {
    if (!settings.gameplay.inraid.saveHealthEnabled) {
        return;
    }

    let body = pmcData.Health.BodyParts;
    let multiplier = settings.gameplay.inraid.saveHealthMultiplier;

    body.Head.Health.Current = (body.Head.Health.Maximum * multiplier);
    body.Chest.Health.Current = (body.Chest.Health.Maximum * multiplier);
    body.Stomach.Health.Current = (body.Stomach.Health.Maximum * multiplier);
    body.LeftArm.Health.Current = (body.LeftArm.Health.Maximum * multiplier);
    body.RightArm.Health.Current = (body.RightArm.Health.Maximum * multiplier);
    body.LeftLeg.Health.Current = (body.LeftLeg.Health.Maximum * multiplier);
    body.RightLeg.Health.Current = (body.RightLeg.Health.Maximum * multiplier);

    pmcData.Health.BodyParts = body;
    return pmcData;
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
    }

    // mark found items and replace item ID's
    offraidData.profile = markFoundItems(pmcData, offraidData.profile, isPlayerScav);
    offraidData.profile.Inventory.items = itm_hf.replaceIDs(offraidData.profile, offraidData.profile.Inventory.items);

    let traderToInsuredItems = {};

    // set profile equipment to the raid equipment
    if (isPlayerScav) {
        scavData = setInventory(scavData, offraidData.profile);
    } else {
        // Find insured items and filter out items still in inventory (if alive).
        // Potential gotcha: itm_hf.replaceIDs don't replace insured item ids. Consider
        // rearranging this block of code if this changes.
        let insuredItems = pmcData.InsuredItems;
        let retainedInsuranceItemIds = {};

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
        pmcData = removeHealth(pmcData);
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
                location: "wastelands"  // Don't think there's a way of getting locations right now, so a placeholder it is.
            }
        };
        events_f.scheduledEventHandler.addToSchedule({
            type: "insuranceReturn",
            sessionID: sessionID,
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

function updateHealth(info, sessionID) {
    logger.logWarning("player condition update event");
    logger.logData(info);
}

module.exports.saveProgress = saveProgress;
module.exports.updateHealth = updateHealth;
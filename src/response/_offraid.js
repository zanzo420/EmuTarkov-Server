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

    // check for insurance
    for (let item of toDelete) {
        for (let insurance of pmcData.InsuredItems) {
            if (item === insurance.itemId && utility.getRandomInt(0, 99) < settings.gameplay.trading.insureReturnChance) {
                insurance_f.remove(pmcData, toDelete[item], sessionID);
                item = "insured";
                break;
            }
        }
    }

    // finally delete them
    for (let item of toDelete) {
        if (item !== "insured") {
            move_f.removeItemFromProfile(pmcData, item);
        }
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
    return pmcDdata;
}

function saveProgress(offraidData, sessionID) {
    if (!settings.gameplay.inraid.saveLootEnabled) {
        return;
    }

    let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
    let scavData = profile_f.profileServer.getScavProfile(sessionID);
    const isPlayerScav = offraidData.isPlayerScav;

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

    // set profile equipment to the raid equipment
    if (isPlayerScav) {
        scavData = setInventory(scavData, offraidData.profile);
    } else {
        pmcData = setInventory(pmcData, offraidData.profile);
    }

    // terminate early for player scavs because we don't care about whether they died.
    if (isPlayerScav) {
        return;
    }

    // remove inventory if player died
    if (offraidData.exit !== "survived" && offraidData.exit !== "runner") {
        pmcData = deleteInventory(pmcData, sessionID);
        pmcData = removeHealth(pmcData);
    }
}

function updateHealth(info, sessionID) {
    logger.logWarning("player condition update event");
    logger.logData(info);
}

module.exports.saveProgress = saveProgress;
module.exports.updateHealth = updateHealth;
"use strict";

require('../libs.js');

function acceptQuest(tmpList, body) {
    tmpList.data[0].Quests.push({
        "qid": body.qid.toString(),
        "startTime": utility.getTimestamp(),
        "status": 2
    });
    // statuses seem as follow -
    // 1 - not accepted |
    // 2 - accepted |
    // 3 - failed |
    // 4 - completed
    profilesDB.update(tmpList);

    item.resetOutput();
    return item.getOutput();

}

function completeQuest(tmpList, body) {
    // -> Complete quest (need rework for giving back quests)
    const sessionID = tmpList.data[0].aid;
    item.resetOutput();
    console.log(sessionID);

    // find Quest data and update trader loyalty
    for (let quest of quests.data) {
        if (quest._id === body.qid) {
            for (let reward of quest.rewards.Success) {
                switch (reward.type) {
                    case "Item":
                        for (let rewardItem of reward.items) {
                            let newReq = {};
                            newReq.item_id = rewardItem._tpl;
                            newReq.count = parseInt(reward.value);

                            profile.addItemToStash(tmpList, newReq);
                            tmpList = profilesDB.get(sessionID); //update it everytime otherwise every given items are deleted
                        }
                        break;

                    case "Experience":
                        tmpList.data[0].Info.Experience += parseInt(reward.value);
                        profilesDB.update(tmpList);
                        tmpList = profilesDB.get(sessionID);// update it because it will be overrided otherwise
                        break;

                    case "TraderStanding":
                        // improve trader standing
                        let tmpTraderInfo = trader.get(quest.traderId, sessionID);

                        tmpTraderInfo.data.loyalty.currentStanding
                        tmpTraderInfo.data.loyalty.currentStanding = tmpTraderInfo.data.loyalty.currentStanding + parseFloat(reward.value);
                        trader.setTrader(tmpTraderInfo.data, sessionID);

                        // level up trader
                        trader.lvlUp(quest.traderId, sessionID);
                        break;
                }
            }
        }
    }

    for (let quest of tmpList.data[0].Quests) {
        if (quest.qid === body.qid) {
            quest.status = 4;
            profilesDB.update(tmpList);
            tmpList = profilesDB.get(sessionID);
            break;
        }
    }

    return item.getOutput();
}

function handoverQuest(tmpList, body) {
    let counter = 0;
    let found = false;
    item.resetOutput();

    for (let itemHandover of body.items) {
        counter += itemHandover.count;
        move_f.removeItem(tmpList, {
            Action: 'Remove',
            item: itemHandover.id
        });
    }

    for (let backendCounter in tmpList.data[0].BackendCounters) {
        if (backendCounter === body.conditionId) {
            tmpList.data[0].BackendCounters[body.conditionId].value += counter;
            found = true;
        }
    }

    if (!found) {
        tmpList.data[0].BackendCounters[body.conditionId] = {
            "id": body.conditionId,
            "qid": body.qid,
            "value": counter
        };
    }

    profilesDB.update(tmpList);
    return item.getOutput();
}

module.exports.acceptQuest = acceptQuest;
module.exports.completeQuest = completeQuest;
module.exports.handoverQuest = handoverQuest;
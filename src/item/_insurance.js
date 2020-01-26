"use strict";

require('../libs.js');

function remove(pmcData, body, sessionID) {
    let toDo = [body];
    
    //Find the item and all of it's relates
    if (toDo[0] !== undefined && toDo[0] !== null && toDo[0] !== "undefined") {
        let ids_toremove = itm_hf.findAndReturnChildren(pmcData, toDo[0]); //get all ids related to this item, +including this item itself

        for (let i in ids_toremove) { //remove one by one all related items and itself
            for (let a in pmcData.Inventory.items) {	//find correct item by id and delete it
                if (pmcData.Inventory.items[a]._id === ids_toremove[i]) {
                    for (let insurance in pmcData.InsuredItems) {
                        if (pmcData.InsuredItems[insurance].itemId == ids_toremove[i]) {
                            pmcData.InsuredItems.splice(insurance, 1);
                        }
                    }
                }
            }
        }

        profile_f.setPmcData(pmcData, sessionID);
    }

    logger.logError("item id is not valid");
}

function cost(info, sessionID) {
    let output = {"err": 0, "errmsg": null, "data": {}};
    let pmcData = profile_f.getPmcProfile(sessionID);

    for (let trader of info.traders) {
        let items = {};

        for (let key of info.items) {
            for (let item of pmcData.Inventory.items) {
                if (item._id === key) {
                    let template = json.parse(json.read(filepaths.templates.items[item._tpl]));

                    items[template.Id] = Math.round(template.Price * settings.gameplay.trading.insureMultiplier);
                    break;
                }
            }
        }

        output.data[trader] = items;
    }

    return json.stringify(output);
}

function insure(pmcData, body, sessionID) {
    item.resetOutput();

    let itemsToPay = [];

    // get the price of all items
    for (let key of body.items) {
        for (let item of pmcData.Inventory.items) {
            if (item._id === key) {
                let template = json.parse(json.read(filepaths.templates.items[item._tpl]));

                itemsToPay.push({
                    "id": item._id,
                    "count": Math.round(template.Price * settings.gameplay.trading.insureMultiplier)
                });
                break;
            }
        }
    }

    // pay the item	to profile
    if (!itm_hf.payMoney(pmcData, {scheme_items: itemsToPay, tid: body.tid}, sessionID)) {
        logger.LogError("no money found");
        return "";
    }

    // add items to InsuredItems list once money has been paid
    for (let key of body.items) {
        for (let item of pmcData.Inventory.items) {
            if (item._id === key) {
                pmcData.InsuredItems.push({"tid": body.tid, "itemId": item._id});
                break;
            }
        }
    }

    return item.getOutput();
}

module.exports.cost = cost;
module.exports.insure = insure;
module.exports.remove = remove;
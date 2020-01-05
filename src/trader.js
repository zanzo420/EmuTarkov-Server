"use strict";

require('./libs.js');

function getPath(id, sessionID = NaN) {
    let traderPath = filepaths.user.profiles.traders[id];

    if (typeof sessionID === "string")
        sessionID = sessionID.replace(/[^0-9]/g, '') - 0;
    
    return traderPath.replace("__REPLACEME__", sessionID);
}

function loadAllTraders(sessionID = NaN) {
    let traders = [];

    // load trader files
    for (let file in filepaths.traders) {
        if (!fs.existsSync(getPath(file, sessionID))) {
            continue;
        }

        if (filepaths.traders.hasOwnProperty(file) && checkTraders(file)) {
            traders.push(json.parse(json.read(getPath(file, sessionID))));
        }
    }

    return {err: 0, errmsg: null, data: traders};
}

function checkTraders(file) {
    return file !== "everything";
}

function get(id, sessionID = NaN) {
    let selectedTrader = id;

    // find the trader
    if (selectedTrader === "everything") {
        return {err: 0, errmsg: "", data: json.parse(json.read(filepaths.traders.everything))};
    } else {
        if (filepaths.traders.hasOwnProperty(selectedTrader)) {
            return {err: 0, errmsg: "", data: json.parse(json.read(getPath(selectedTrader, sessionID)))};
        }
    }

    // trader not found
    console.log("Couldn't find trader of ID " + id, "white", "red");
    return {err: 999, errmsg: "Couldn't find trader of ID " + id, data: null};
}

function getAssort(id, sessionID = NaN) {
    let selectedTrader = id;

    // always return everything trader
    if (selectedTrader === "everything") {
        return json.parse(json.read(filepaths.user.cache.assort_everything));
    } else {
        if (filepaths.user.cache.hasOwnProperty("assort_" + selectedTrader)) {
            return json.parse(json.read(filepaths.user.cache["assort_" + selectedTrader]));
        }
    }

    // assort not found
    console.log("Couldn't find assort of ID " + trader, "white", "red");
    return {err: 999, errmsg: "Couldn't find assort of ID " + trader, data: null};
}

function setTrader(data, sessionID = NaN) {
    return json.write(getPath(data._id, sessionID), data);
}

function lvlUp(id, sessionID = NaN) {
    let currentProfile = profilesDB.get(sessionID);
    let currentTrader = get(id, sessionID);
    let loyaltyLevels = currentTrader.data.loyalty.loyaltyLevels;

    for (let level in loyaltyLevels) {
        if (currentTrader.data.loyalty.currentLevel <= level) {
            continue;
        }

        if (loyaltyLevels[level].minLevel > currentProfile.data[0].Info.Level) {
            return;
        }

        if (loyaltyLevels[level].minSalesSum > currentTrader.data.loyalty.currentSalesSum) {
            return;
        }

        if (loyaltyLevels[level].minStanding > currentTrader.data.loyalty.currentStanding) {
            return;
        }

        // level starts at 0, currentLevel at 1
        currentTrader.data.loyalty.currentLevel = 1 + parseInt(level);
        setTrader(currentTrader.data, sessionID);
    }
}

module.exports.getPath = getPath;
module.exports.loadAllTraders = loadAllTraders;
module.exports.get = get;
module.exports.getAssort = getAssort;
module.exports.setTrader = setTrader;
module.exports.lvlUp = lvlUp;

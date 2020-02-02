"use strict";

require('./libs.js');

const staticRoutes = {
    "/": showIndex,
    "/inv": showInventoryChecker,
    "/favicon.ico": nullResponse,
    "/client/friend/list": getFriendList,
    "/client/game/profile/items/moving": handleItems,
    "/client/languages": getLocale,
    "/client/items": getItems,
    "/client/globals": getGlobals,
    "/client/game/profile/list": getProfileData,
    "/client/game/profile/select": selectProfile,
    "/client/profile/status": getProfileStatus,
    "/client/weather": getWeather,
    "/client/locations": getLocations,
    "/client/handbook/templates": getTemplates,
    "/client/quest/list": getQuests,
    "/client/game/bot/generate": getBots,
    "/client/trading/api/getTradersList": getTraderList,
    "/client/server/list": getServer,
    "/client/ragfair/search": searchRagfair,
    "/client/ragfair/find": searchRagfair,
    "/client/chatServer/list": getChatServerList,
    "/client/game/profile/nickname/change": changeNickname,
    "/client/game/profile/voice/change": changeVoice,
    "/client/repair/exec": handleRepair,
    "/client/game/keepalive": handleKeepAlive,
    "/client/game/version/validate": validateGameVersion,
    "/client/game/config": getGameConfig,
    "/client/customization": getCustomization,
    "/client/trading/customization/storage": getCustomizationStorage,
    "/client/hideout/production/recipes": getHideoutRecipes,
    "/client/hideout/settings": getHideoutSettings,
    "/client/hideout/areas": getHideoutAreas,
    "/client/hideout/production/scavcase/recipes": getScavDatacaseRecipes,
    "/client/handbook/builds/my/list": getHandbookUserlist,
    "/client/notifier/channel/create": createNotifierChannel,
    "/client/game/profile/nickname/reserved": getReservedNickname,
    "/client/game/profile/nickname/validate": validateNickname,
    "/client/game/profile/create": createProfile,
    "/client/insurance/items/list/cost": getInsuranceCost,
    "/client/game/logout": nullResponse,
    "/client/match/exit": nullResponse,
    "/client/game/profile/savage/regenerate": regenerateScav,
    "/client/mail/dialog/list": getMailDialogList,
    "/client/mail/dialog/view": getMailDialogView,
    "/client/mail/dialog/info": getMailDialogInfo,
    "/client/mail/dialog/remove": removeDialog,
    "/client/mail/dialog/pin": pinDialog,
    "/client/mail/dialog/unpin": unpinDialog,
    "/client/mail/dialog/read": setRead,
    "/client/mail/dialog/getAllAttachments": getAllAttachments,
    "/client/friend/request/list/outbox": nullArrayResponse,
    "/client/friend/request/list/inbox": nullArrayResponse,

    // EmuTarkov-Launcher
    "/launcher/profile/login": loginUser,

    // EmuLib
    "/OfflineRaidSave": saveProgress,
    "/player/health/events": updateHealth
};

const dynamicRoutes = {
    "/api/location": getMap,
    ".jpg": getImage,
    ".png": getImage,
    "/?last_id": handleNotifierCustomLink,
    "/client/trading/api/getUserAssortPrice/trader/": getProfilePurchases,
    "/client/trading/api/getTrader/": getTrader,
    "/client/trading/api/getTraderAssort/": getAssort,
    "/client/trading/customization/": getCustomizationOffers,
    "/client/menu/locale/": getMenuLocale,
    "/client/locale/": getGlobalLocale,
    "/notifierBase": nullArrayResponse,
    "/notifierServer": notify,
    "/push/notifier/get/": nullArrayResponse
};

function nullResponse(url, info, sessionID) {
    return '{"err":0, "errmsg":null, "data":null}';
}

function nullArrayResponse(url, info, sessionID) {
    return '{"err":0, "errmsg":null, "data":[]}';
}

function showIndex(url, info, sessionID) {
    return index_f.index();
}

function showInventoryChecker(url, info, sessionID) {
    return index_f.inventory();
}

function notify(url, info) {
    return "NOTIFY";
}

function getGameConfig(url, info, sessionID) {
    let backendUrl = "https://" + ip;
    return '{"err":0,"errmsg":null,"data":{"queued": false, "banTime": 0, "hash": "BAN0", "lang": "en", "aid":' + sessionID + ', "token": "token_' + sessionID + '", "taxonomy": "341", "activeProfileId": "user' + sessionID + 'pmc", "nickname": "user", "backend": {"Trading":"' + backendUrl + '", "Messaging":"' + backendUrl + '", "Main":"' + backendUrl + '", "RagFair":"' + backendUrl + '"}, "totalInGame": 0}}';
}

function getFriendList(url, info, sessionID) {
    return '{"err":0, "errmsg":null, "data":{"Friends":[], "Ignore":[], "InIgnoreList":[]}}';
}

function handleItems(url, info, sessionID) {
    return item.moving(info, sessionID);
}

function getLocale(url, info, sessionID) {
    return locale.getLanguages();
}

function loginUser(url, info, sessionID) {
    return account_f.accountServer.findID(info);
}

function getInsuranceCost(url, info, sessionID) {
    return insurance_f.cost(info, sessionID);
}

function getItems(url, info, sessionID) {
    return json.stringify(items);
}

function getGlobals(url, info, sessionID) {
    let globals = globalSettings;
    globals.data.time = Date.now() / 1000;
    return json.stringify(globals);
}

function getProfileData(url, info, sessionID) {
    let output = {err: 0, errmsg: null, data: []};

    if (!account_f.accountServer.isWiped(sessionID)) {
        output.data.push(profile_f.profileServer.getPmcProfile(sessionID));
        output.data.push(profile_f.profileServer.getScavProfile(sessionID));
    }

    return json.stringify(output);
}

function regenerateScav(url, info, sessionID) {
    return json.stringify({err: 0, errmsg: null, data: [profile_f.profileServer.generateScav(sessionID)]});
}

function selectProfile(url, info, sessionID) {
    return '{"err":0, "errmsg":null, "data":{"status":"ok", "notifier":{"server":"https://' + ip + '/", "channel_id":"testChannel"}}}';
}

function getProfileStatus(url, info, sessionID) {
    return '{"err":0, "errmsg":null, "data":[{"profileid":"scav' + sessionID + '", "status":"Free", "sid":"", "ip":"", "port":0}, {"profileid":"pmc' + sessionID + '", "status":"Free", "sid":"", "ip":"", "port":0}]}';
}

function getWeather(url, info, sessionID) {
    return weather_f.generate();
}

function getLocations(url, info, sessionID) {
    return map_f.mapServer.generateAll();
}

function getTemplates(url, info, sessionID) {
    return json.read(filepaths.user.cache.templates);
}

function getQuests(url, info, sessionID) {
    return json.stringify(quests);
}

function getBots(url, info, sessionID) {
    return json.stringify(bots.generate(info));
}

function getTraderList(url, info, sessionID) {
    return json.stringify(trader_f.traderServer.getAllTraders(sessionID));
}

function getServer(url, info, sessionID) {
    return '{"err":0, "errmsg":null, "data":[{"ip":"' + ip + '", "port":"' + 443 + '"}]}';
}

function searchRagfair(url, info, sessionID) {
    return ragfair_f.getOffers(info);
}

function getChatServerList(url, info, sessionID) {
    return '{"err":0, "errmsg":null, "data":[{"_id":"5ae20a0dcb1c13123084756f", "RegistrationId":20, "DateTime":' + Math.floor(new Date() / 1000) + ', "IsDeveloper":true, "Regions":["EUR"], "VersionId":"bgkidft87ddd", "Ip":"", "Port":0, "Chats":[{"_id":"0", "Members":0}]}]}';
}

function changeNickname(url, info, sessionID) {
    return profile_f.profileServer.changeNickname(info, sessionID);
}

function changeVoice(url, info, sessionID) {
    profile_f.profileServer.changeVoice(info, sessionID);
    return nullResponse(url, info, sessionID);
}

function handleRepair(url, info, sessionID) {
    return repair_f.main(info);
}

function handleKeepAlive(url, info, sessionID) {
    keepAlive_f.main(sessionID);
    return '{"err":0,"errmsg":null,"data":{"msg":"OK"}}';
}

function validateGameVersion(url, info, sessionID) {
    constants.setVersion(info.version.major);
    return nullResponse(url, info, sessionID);
}

function getCustomization(info) {
    return json.stringify(customizationOutfits);
}

function getCustomizationOffers(url, info, sessionID) {
    let tmpOffers = [];
    let offers = customizationOffers;
    let splittedUrl = url.split('/');

    for (let offer of offers.data) {
        if (offer.tid === splittedUrl[splittedUrl.length - 2]) {
            tmpOffers.push(offer);
        }
    }

    offers.data = tmpOffers;
    return json.stringify(offers);
}

function getCustomizationStorage(url, info, sessionID) {
    return json.read(customization_f.getPath(sessionID));
}

function getHideoutRecipes(url, info, sessionID) {
    return json.read(filepaths.user.cache.hideout_production);
}

function getHideoutSettings(url, info, sessionID) {
    return json.read(filepaths.hideout.settings);
}

function getHideoutAreas(url, info, sessionID) {
    return json.read(filepaths.user.cache.hideout_areas);
}

function getScavDatacaseRecipes(url, info, sessionID) {
    return json.read(filepaths.user.cache.hideout_scavcase);
}

function getHandbookUserlist(url, info, sessionID) {
    return '{"err":0,"errmsg":null,"data":' + json.stringify(weaponBuilds_f.getUserBuilds(sessionID)) + '}';
}

function createNotifierChannel(url, info, sessionID) {
    return '{"err":0,"errmsg":null,"data":{"notifier":{"server":"https://' + ip +
           '/","channel_id":"testChannel","url":"https://' + ip + '/notifierServer/get/' + 
           sessionID + '"},"notifierServer":"https://' + ip + '/notifierServer/get/' + sessionID + '"}}';
}

function getReservedNickname(url, info, sessionID) {
    return '{"err":0,"errmsg":null,"data":"' + account_f.accountServer.getReservedNickname(sessionID) + '"}';
}

function validateNickname(url, info, sessionID) {
    // todo: validate nickname properly
    return '{"err":0,"errmsg":null,"data":{"status":"ok"}}';
}

function createProfile(url, info, sessionID) {
    profile_f.profileServer.createProfile(info, sessionID);
    return '{"err":0,"errmsg":null,"data":{"uid":"pmc' + sessionID + '"}}';
}

function getMailDialogList(url, info, sessionID) {
    return dialogue_f.dialogueServer.generateDialogueList(sessionID);
}

function getMailDialogView(url, info, sessionID) {
    return dialogue_f.dialogueServer.generateDialogueView(info.dialogId, sessionID);
}

function getMailDialogInfo(url, info, sessionID) {
    let data = dialogue_f.dialogueServer.getDialogueInfo(info.dialogId, sessionID);
    return '{"err":0,"errmsg":null,"data":' + json.stringify(data) + '}';
}

function removeDialog(url, info, sessionID) {
    dialogue_f.dialogueServer.removeDialogue(info.dialogId, sessionID);
    return nullArrayResponse;
}

function pinDialog(url, info, sessionID) {
    dialogue_f.dialogueServer.setDialoguePin(info.dialogId, true, sessionID);
    return nullArrayResponse;
}

function unpinDialog(url, info, sessionID) {
    dialogue_f.dialogueServer.setDialoguePin(info.dialogId, false, sessionID);
    return nullArrayResponse;
}

function setRead(url, info, sessionID) {
    dialogue_f.dialogueServer.setRead(info.dialogs, sessionID);
    return nullArrayResponse;
}

function saveProgress(url, info, sessionID) {
    offraid_f.saveProgress(info, sessionID);
    return nullResponse;
}

function updateHealth(url, info, sessionID) {
    health_f.healthServer.updateHealth(info, sessionID);
    return nullResponse;
}

function getAllAttachments(url, info, sessionID) {
    let data = dialogue_f.dialogueServer.getAllAttachments(info.dialogId, sessionID);
    return '{"err":0,"errmsg":null,"data":' + json.stringify(data) + '}';
}

function getMap(url, info, sessionID) {
    return "MAP";
}

function getImage(url, info, sessionID) {
    return "IMAGE";
}

function handleNotifierCustomLink(url, info, sessionID) {
    return 'NOTIFY';
}

function getProfilePurchases(url, info, sessionID) {
    // let's grab the traderId from the url
    return profile_f.getPurchasesData(url.substr(url.lastIndexOf('/') + 1), sessionID);
}

function getTrader(url, info, sessionID) {
    return json.stringify(trader_f.traderServer.getTrader(url.replace("/client/trading/api/getTrader/", ''), sessionID));
}

function getAssort(url, info, sessionID) {
    return json.stringify(trader_f.traderServer.getAssort(url.replace("/client/trading/api/getTraderAssort/", '')));
}

function getMenuLocale(url, info, sessionID) {
    return locale.getMenu(url.replace("/client/menu/locale/", ''));
}

function getGlobalLocale(url, info, sessionID) {
    return locale.getGlobal(url.replace("/client/locale/", ''));
}

function getResponse(req, body, sessionID) {
    let output = "";
    let url = req.url;
    let info = {};

    // parse body
    if (body !== "") {
        info = json.parse(body);
    }

    // remove ?retry=X from URL
    if (url.indexOf("?retry=") !== -1) {
        url = url.split("?retry=")[0];
    }
    
    // route request
    if (typeof staticRoutes[url] !== "undefined") {
        output = staticRoutes[url](url, info, sessionID);
    } else {
        for (let key in dynamicRoutes) {
            if (url.indexOf(key) !== -1) {
                output = dynamicRoutes[key](url, info, sessionID);
            }
        }
    }

    // request couldn't be handled
    if (output === "") {
        logger.logError("[UNHANDLED][" + url + "] request data: " + json.stringify(info));
        output = '{"err":404, "errmsg":"UNHANDLED RESPONSE: ' + url + '", "data":null}';
    }

    // load from cache when server is in release mode
    if (typeof info.crc !== "undefined") {
        let crctest = json.parse(output);

        if (typeof crctest.crc !== "undefined" && output.crc === crctest.crc) {
            logger.logWarning("[Loading from game cache files]");
            output = nullResponse(url, info, sessionID);
        }
    }

    return output;
}

module.exports.getResponse = getResponse;
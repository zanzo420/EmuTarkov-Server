"use strict";

require("../libs.js");

let maps = {};

function generate(mapName) {
    let data = maps[mapName];

    // generate loot
    let lootCount = settings.gameplay.maploot[mapName];
    let keys = Object.keys(filepaths.maps[mapName].loot);

    for (let i = 0; i < lootCount; i++) {
        let item = json.parse(json.read(filepaths.maps[mapName].loot[keys[utility.getRandomInt(0, keys.length - 1)]]));
        let found = false;

        // check for duplicate
        for (let loot of data.Loot) {
            if (item.Id == loot.Id) {
                found = true;
                break;
            }
        }

        if (found) {
            continue;
        }

        // unique spawn
        data.Loot.push(item);
    }

    // store map in memory
    return data;
}

function get(map) {
    let mapName = map.toLowerCase().replace(" ", "");
    return json.stringify(generate(mapName));
}

function generateAll() {
    let base = json.parse(json.read("db/cache/locations.json"));
    let keys = Object.keys(filepaths.maps);

    for (let mapName of keys) {
        if (typeof maps[mapName] === "undefined") {
            maps[mapName] = json.parse(json.read(filepaths.maps[mapName].base));
        }
    }

    let data = maps;

    for (let mapName in maps) {
        data[maps[mapName]._Id] = maps[mapName];
        delete data[mapName];
    }

    base.data.locations = maps;
    return json.stringify(base);
}

module.exports.get = get;
module.exports.generateAll = generateAll;
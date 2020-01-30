"use strict";

require("../libs.js");

let maps = {};

function generate(mapName) {
    let data = json.parse(json.read(filepaths.maps[mapName].base));

    // set backend url
    data.BackendUrl = "https://' + ip +'/";

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
    maps[mapName] = data;
}

function get(map) {
    let mapName = map.toLowerCase().replace(" ", "");

    if (typeof maps[mapName] === "undefined") {
        generate(mapName);
    }

    return json.stringify(maps[mapName]);
}

function generateAll() {
    let base = json.parse(json.read(filepaths.cache.locations));
    let keys = Object.keys(filepaths.maps);

    // force generation of a new map preset
    for (let map in keys) {
        generate(keys[map]);
    }

    base.data.locations = maps;
    return json.stringify(base);
}

module.exports.get = get;
module.exports.generateAll = generateAll;
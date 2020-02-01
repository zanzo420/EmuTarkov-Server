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

        // add unique spawn
        data.Loot.push(item);
    }

    return data;
}

// todo: use cache system
function load(mapName) {
    let map = json.parse(json.read(filepaths.maps[mapName].base));

    // set infill locations
    for (let spawn in filepaths.maps[mapName].entries) {
        map.SpawnAreas.push(json.parse(json.read(filepaths.maps[mapName].entries[spawn])));
    }

    // set exfill locations
    for (let exit in filepaths.maps[mapName].exits) {
        map.exits.push(json.parse(json.read(filepaths.maps[mapName].exits[exit])));
    }

    // set scav locations
    for (let wave in filepaths.maps[mapName].waves) {
        map.waves.push(json.parse(json.read(filepaths.maps[mapName].waves[wave])));
    }

    // set boss locations
    for (let spawn in filepaths.maps[mapName].bosses) {
        map.BossLocationSpawn.push(json.parse(json.read(filepaths.maps[mapName].bosses[spawn])));
    }

    maps[mapName] = map;
}

function get(map) {
    let mapName = map.toLowerCase().replace(" ", "");
    return json.stringify(generate(mapName));
}

function generateAll() {
    let base = json.parse(json.read("db/cache/locations.json"));
    let keys = Object.keys(filepaths.maps);
    let data = {};

    // load maps
    for (let mapName of keys) {
        if (typeof maps[mapName] === "undefined") {
            load(mapName);
        }
    }

    // use right id's
    for (let mapName in maps) {
        data[maps[mapName]._Id] = maps[mapName];
    }

    base.data.locations = data;
    return json.stringify(base);
}

module.exports.get = get;
module.exports.generateAll = generateAll;
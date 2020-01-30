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
function get(mapName) {
    let map = json.parse(json.read(filepaths.maps[mapName].base));
    let mapPath = "db/maps/" + mapName + "/";

    // set exit locations
    if (fs.existsSync(mapPath + "exits/")) {
        for (let exit in map.Exits) {
            map.Exits[exit].push(json.parse(json.read(mapPath + "exits/exfill_" + exit + ".json")));
        }
    }

    // set bot spawns
    if (fs.existsSync(mapPath + "waves/")) {
        for (let wave in map.waves) {
            map.waves[wave].push(json.parse(json.read(mapPath + "waves/wave_" + wave + ".json")));
        }
    }

    // set infill locations
    if (fs.existsSync(mapPath + "entries/")) {
        for (let spawn in map.SpawnAreas) {
            map.SpawnAreas[spawn].push(json.parse(json.read(mapPath + "entries/infill_" + spawn + ".json")));
        }
    }

    // set boss locations
    if (fs.existsSync(mapPath + "bosses/") && map.BossLocationSpawn !== false) {
        for (let spawn in map.BossLocationSpawn) {
            map.BossLocationSpawn[spawn].push(json.parse(json.read(mapPath + "bosses/boss_" + spawn + ".json")));
        }
    }

    maps[mapName] = map;
}

function load(map) {
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
            get(mapName);
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
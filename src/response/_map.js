"use strict";

require("../libs.js");

let maps = {};

function generate(mapName) {
    let data = maps[mapName];
    console.log(mapName);
    console.log(data);
    console.log(Object.keys(filepaths.maps));

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

function get(map) {
    let mapName = map.toLowerCase().replace(" ", "");
    return json.stringify(generate(mapName));
}

function generateAll() {
    let base = json.parse(json.read("db/cache/locations.json"));
    let keys = Object.keys(filepaths.maps);

    // load maps
    for (let mapName of keys) {
        if (typeof maps[mapName] === "undefined") {
            maps[mapName] = json.parse(json.read(filepaths.maps[mapName].base));

            let map = maps[mapName];
            let mapPath = "db/maps/" + mapName + "/";

            for (let exit in map.Exits) {
                json.write(mapPath + "exits/exfill_" + exit + ".json", map.Exits[exit]);
            }

            for (let wave in map.waves) {
                json.write(mapPath + "waves/wave_" + wave + ".json", map.waves[wave]);
            }

            for (let spawn in map.SpawnAreas) {
                json.write(mapPath + "entries/infill_" + spawn + ".json", map.SpawnAreas[spawn]);
            }

            if (map.BossLocationSpawn !== false) {
                for (let spawn in map.BossLocationSpawn) {
                    json.write(mapPath + "bosses/boss_" + spawn + ".json", map.BossLocationSpawn[spawn]);
                }
            }

            map.Loot = [];
            map.Exits = [];
            map.waves = [];
            map.Exits = [];
            map.SpawnAreas = [];
            map.BossLocationSpawn = [];

            json.write(filepaths.maps[mapName].base, maps[mapName]);
        }
    }

    // use right id's
    let data = {};

    for (let mapName in maps) {
        data[maps[mapName]._Id] = maps[mapName];
    }

    base.data.locations = data;
    return json.stringify(base);
}

module.exports.get = get;
module.exports.generateAll = generateAll;
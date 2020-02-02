"use strict";

require("../libs.js");

/* MapServer class maintains list of maps in memory. */
class MapServer {
    constructor() {
        this.maps = {};
        this.initializeMaps();
    }

    /* Load all the maps into memory. */
    initializeMaps() {
        logger.logWarning("Loading maps into RAM...");

        this.maps = {};
        let keys = Object.keys(filepaths.maps);

        for (let mapName of keys) {
            let node = filepaths.maps[mapName];
            let map = json.parse(json.read(node.base));

            // set infill locations
            for (let entry in node.entries) {
                map.SpawnAreas.push(json.parse(json.read(node.entries[entry])));
            }

            // set exfill locations
            for (let exit in node.exits) {
                map.exits.push(json.parse(json.read(node.exits[exit])));
            }

            // set scav locations
            for (let wave in node.waves) {
                map.waves.push(json.parse(json.read(node.waves[wave])));
            }

            // set boss locations
            for (let spawn in node.bosses) {
                map.BossLocationSpawn.push(json.parse(json.read(node.bosses[spawn])));
            }

            this.maps[mapName] = map;
        }
    }

    /* generates a random map preset to use for local session */
    generate(mapName) {
        let data = this.maps[mapName];

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

    /* get a map with generated loot data */
    get(map) {
        let mapName = map.toLowerCase().replace(" ", "");
        return json.stringify(this.generate(mapName));
    }

    /* get all maps without loot data */
    generateAll() {
        let base = json.parse(json.read("db/cache/locations.json"));
        let data = {};

        // use right id's
        for (let mapName in this.maps) {
            data[this.maps[mapName]._Id] = this.maps[mapName];
        }

        base.data.locations = data;
        return json.stringify(base);
    }
}

module.exports.mapServer = new MapServer();
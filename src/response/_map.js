"use strict";

require("../libs.js");

function get(mapName) {        
    let data = json.parse(json.read(filepaths.maps[mapName].base));
    let lootCount = settings.gameplay.maploot[mapName];
    let keys = Object.keys(filepaths.maps[mapName].loot);

    // set backend url
    data.BackendUrl = "https://' + ip +'/";

    console.log(filepaths.maps[mapName].loot);

    // generate loot
    if (mapName !== "hideout") {
        for (let i = 0; i < lootCount; i++) {
            let item = json.parse(json.read(filepaths.maps[mapName].loot[keys[utility.getRandomInt(0, keys.length - 1)]]));
            let found = false;

            for (let loot of data.Loot) {
                if (item.Id == loot.Id) {
                    found = true;
                    break;
                }
            }

            if (found) {
                continue;
            }

            data.Loot.push(item);
        }
    }

    // TODO: code here
    console.log(data.Loot);
    return json.stringify(data);
}

module.exports.get = get;
"use strict";

require("../libs.js");

function get(mapName) {        
    let data = json.parse(json.read(filepaths.maps[mapName].base));
    let lootCount = settings.gameplay.maploot[mapName];
    let lootFiles = Object.keys(filepaths.maps[mapName].loot);

    // set backend url
    data.BackendUrl = "https://' + ip +'/";
    
    // generate loot
    if (mapName !== "hideout") {
        for (let loot in lootCount) {
            data.Loot.push(json.parse(json.read(filepaths.maps[mapName].loot[lootFiles[loot]])));
        }
    }
    
    // TODO: code here
    console.log(data);
    return json.stringify(data);
}

module.exports.get = get;
"use strict";

require("../libs.js");

function get(mapName) {        
    let data = json.parse(json.read(filepaths.maps[mapName].base));

    // set backend url
    data.BackendUrl = "https://' + ip +'/";
    
    // generate loot
    // TODO: code here

    return json.stringify(data);
}

module.exports.get = get;
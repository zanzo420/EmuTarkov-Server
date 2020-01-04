"use strict";

require('../libs.js');

class ProfilesDB {
    // runPeriod = time for updating profiles on disk, in seconds
    constructor(runPeriod = 1) {
        if (ProfilesDB.exists) return ProfilesDB.instance;

        this.profiles = [];
        this.needUpdate = false;

        setInterval(this.run.bind(this), runPeriod * 1000);
        // create only once
        ProfilesDB.exists = true;
        ProfilesDB.instance = this;
    }

    get(id = -1) {
        if (typeof id === "string")
            id = id.replace(/[^0-9]/g, '') - 0;

        return this.profiles[id];
    }

    update(profileData) {
        const id = profileData.data[0].aid.replace(/[^0-9]/g, '') - 0;
        this.profiles[id] = profileData;

        this.needUpdate = true;
    }

    // executed every given period, specified in the class constructor
    run() {
        if (!this.needUpdate) return void 0;
        console.info("ProfilesDB.run(), we have a new data for update");

        this.needUpdate = false;

        this.profiles.forEach(profileData => {
            profile.setCharacterData(profileData);
        });
    }
}

module.exports.profilesDB = new ProfilesDB(1);
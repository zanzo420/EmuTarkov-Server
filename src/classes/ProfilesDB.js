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

    // used for get profile data from memory cache by sessionID
    get(sessionID = NaN) {
        if (typeof sessionID === "string")
            sessionID = sessionID.replace(/[^0-9]/g, '') - 0;

        let profileData = this.profiles[sessionID];
        if (profileData === undefined) {
            profileData = profile.getCharacterData(sessionID);

            if (profileData.data.length > 0) this.update(profileData);
        }

        return profileData;
    }

    // used for put or update profile data in memory cache
    update(profileData) {
        let id = profileData.data[0].aid;
        if (typeof id === "string") {
            id = id.replace(/[^0-9]/g, '') - 0;
        }

        this.profiles[id] = profileData;
        this.needUpdate = true;
    }

    // executed every given period, specified in the class constructor
    run() {
        if (!this.needUpdate) return void 0;

        this.needUpdate = false;

        this.profiles.forEach(profileData => {
            profile.setCharacterData(profileData);
        });
    }
}

module.exports.profilesDB = new ProfilesDB(1);
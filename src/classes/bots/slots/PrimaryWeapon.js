"use strict";

require('../../../libs.js');
const crypto = require('crypto');

module.exports = class PrimaryWeapon {
    constructor(WeaponGenerator) {
        this.modSlots = [];
        this.conflictingIDs = [];
        this.magItem = null;
        this.generatedWeaponItem = null;
        this.generatedWeapon = null;

        this.generator = WeaponGenerator;
    }

    generate(role = 'assault', slot, parentID) {
        // get randomly weapon by role
        this.generatedWeaponItem = this.generator.getRandomWeaponByRole(this.generator.checkRole(role), slot);
        // debug this.generatedWeaponItem = this.generator.itemsValues.find(item => item._name === 'weapon_zmz_pp-91-01_9x18pm');

        this.generatedWeapon = {
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": this.generatedWeaponItem._id,
            "parentId": parentID,
            "slotId": slot._name
        };
        this.modSlots[this.generatedWeapon._tpl] = this.generatedWeapon;

        // get randomly mods for weapon
        this.generateMods(this.generatedWeapon._id, this.generatedWeaponItem._props);

        return this.getAssembledWeapon();
    }

    getAssembledWeapon() {
        return {
            items: Object.values(this.modSlots),
            weapon: this.generatedWeaponItem,
            magItem: this.magItem
        };
    }

    generateMods(parentID, {Slots}, allConflictingIDs = []) {
        Slots.forEach(slot => {
            // skip if that mod has already been installed
            if (this.modSlots[slot._id]) {
                return;
            }

            let slotFilters = this.getFiltersBySlot(slot);
            if (!slotFilters) return;

            // checks for required slot
            let isRequired = this.generator.isContainRequiredSlots(slot) ? true : (Math.random() >= 0.5);

            // get randomly mod id
            let randomModID = slotFilters[Math.floor(Math.random() * slotFilters.length)];
            if (this.isItemIDInBlackList(randomModID)) return;

            // check all installed mods on conflicting with that randomModID
            if (this.isConflicting(randomModID)) {
                randomModID = this.resolveConflicting(slot);
                if (!randomModID) {
                    return
                }
            }

            let randomModItem = this.generator.items[randomModID];
            let isMagazineSlot = false;

            // check if that a mag
            if (randomModItem._props.hasOwnProperty('Cartridges')) {
                isMagazineSlot = true;
                isRequired = true;
            }

            // if that mod is not required skip them
            if (!isRequired) return;

            let mod = {
                "_id": crypto.randomBytes(12).toString('hex'),
                "_tpl": randomModItem._id,
                "parentId": parentID,
                "slotId": slot._name,
                "upd": {
                    "StackObjectsCount": 1
                }
            };

            this.modSlots[slot._id] = mod;
            this.conflictingIDs.push(...randomModItem._props.ConflictingItems);

            // if is mag then generate cartridge for them
            if (isMagazineSlot) {
                this.magItem = randomModItem;
                let defAmmoItem = global.items.data[this.generatedWeaponItem._props.defAmmo];
                let magCartridge = this.generator.generateCartridgeForMag(mod._id, randomModItem._props, defAmmoItem._props.Caliber);
                this.modSlots[magCartridge._tpl] = magCartridge;
            }

            // generate parent mods
            if (randomModItem._props.hasOwnProperty('Slots') && randomModItem._props.Slots.length > 0) {
                this.generateMods(mod._id, randomModItem._props, allConflictingIDs);
            }
        });
    }

    getFiltersBySlot(slot) {
        let filters = slot._props.filters[0].Filter;
        return (filters && filters.length > 0) ? filters : null;
    }

    isConflicting(itemID) {
        if (this.conflictingIDs.includes(itemID)) return true;
        let installedMods = Object.values(this.modSlots);

        let item = this.generator.items[itemID];
        for (let itemConflictID of item._props.ConflictingItems) {
            let conflictingItem = installedMods.find(slot => slot._tpl === itemConflictID);
            if (conflictingItem) {
                return true;
            }
        }
        return false;
    }

    resolveConflicting(slot) {
        const slotFilters = this.getFiltersBySlot(slot);

        // this slot is required, we can't leave them empty
        // try to find any non conflicting item id
        for (let requiredModID of slotFilters) {
            if (!this.isConflicting(requiredModID)) {
                return requiredModID;
            }
        }

        // skip if that slot is not required
        if (!slot._required) return null;

        console.error(`PrimaryWeapon.resolveConflicting(). weapon assembling stopped. Houston, we have a problem, modID is conflicting with other items!!!!!!!!!`);
        return null;
    }

    isItemIDInBlackList(itemID) {
        // launcher_ak74_izhmash_gp34
        const blackList = ['5648b62b4bdc2d9d488b4585'];
        return blackList.includes(itemID);
    }
};
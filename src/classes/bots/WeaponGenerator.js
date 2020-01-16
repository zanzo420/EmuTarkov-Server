"use strict";

require('../../libs.js');
const crypto = require('crypto');
const primaryWeapon = require('./slots/PrimaryWeapon');

class WeaponGenerator {
    constructor(items) {
        // create instance of that class only once
        if (WeaponGenerator.exists) return WeaponGenerator.instance;

        this.items = items;
        // get values of items
        this.itemsValues = Object.values(this.items);
        this.fillVariables();

        WeaponGenerator.exists = true;
        WeaponGenerator.instance = this;
        this.inventoryGenerator = global.invGen;
    }

    fillVariables() {
        // get inventory item
        this.inventoryItem = this.itemsValues.find(item => item._name === 'Default Inventory');
        // find weapon item and get it id
        const weaponItemID = this.itemsValues.find(item => item._name === 'Weapon')._id;

        //find all possible types of weapon
        // exclude SpecialWeapon and GrenadeLauncher, because that types not have a weapons
        this.allWeaponTypes = this.itemsValues.filter(item => item._parent === weaponItemID && ['SpecialWeapon', 'GrenadeLauncher'].indexOf(item._name) < 0);

        // get all grenade items
        this.grenadeItems = this.itemsValues.filter(item => item._parent === '543be6564bdc2df4348b4568' && item._id !== '5a2a57cfc4a2826c6e06d44a');

        // get all ammo items
        this.allAmmoItems = this.itemsValues.filter(item => {
            return item._props.hasOwnProperty('ammoType') && item._name.startsWith('patron');
        });

        this.setAllWeaponsForSlots();
        this.fillWeaponSlotsByRole();
    }

    fillWeaponSlotsByRole() {
        const marksmanWeaponClasses = ['assaultCarbine', 'marksmanRifle', 'sniperRifle'];
        this.typesByRole = {all: {}, marksman: {}};

        Object.values(this.weaponSlots).forEach(slot => {
            this.typesByRole.all[slot._name] = {_name: slot._name, _id: slot._id, weaponItems: slot.weaponItems};
            this.typesByRole.marksman[slot._name] = {_name: slot._name, _id: slot._id, weaponItems: []};

            // set weapon items for bots with sniper role
            if (slot._name === 'FirstPrimaryWeapon') {
                this.typesByRole.marksman.FirstPrimaryWeapon.weaponItems = slot.weaponItems.filter(({_props}) => {
                    return marksmanWeaponClasses.includes(_props.weapClass);
                });
            }
            // set weapon items for bots with sniper role
            if (slot._name === 'SecondPrimaryWeapon') {
                this.typesByRole.marksman.SecondPrimaryWeapon.weaponItems = slot.weaponItems.filter(({_props}) => {
                    return marksmanWeaponClasses.includes(_props.weapClass);
                });
            }
            // set weapon items for bots with sniper role
            if (slot._name === 'Holster') {
                this.typesByRole.marksman.Holster.weaponItems = slot.weaponItems;
            }
        });
    }

    setAllWeaponsForSlots() {
        this.weaponSlots = {FirstPrimaryWeapon: {}, SecondPrimaryWeapon: {}, Holster: {}};
        const slotKeys = Object.keys(this.weaponSlots);
        const {Slots} = this.inventoryItem._props;

        Slots.forEach(slot => {
            if (slotKeys.includes(slot._name)) {
                let slotFilters = slot._props.filters[0].Filter;
                let weaponTypes = this.allWeaponTypes.filter(type => slotFilters.includes(type._id));
                let weaponItemsByType = [];

                weaponTypes.forEach(weaponType => {
                    let weaponItems = this.itemsValues.filter(item => item._parent === weaponType._id);
                    weaponItemsByType.push(...weaponItems);
                });

                this.weaponSlots[slot._name] = {
                    _id: slot._id,
                    _name: slot._name,
                    filters: slotFilters,
                    types: weaponTypes,
                    weaponItems: weaponItemsByType
                };
            }
        });
    }

    checkRole(role) {
        if (['marksman'].indexOf(role) > -1) return role;
        console.debug(`WeaponGenerator.getRole(), unknown role name: ${role}`);
        return 'all';
    }

    generatePrimaryWeaponSlot(role = 'assault', equipment) {
        const primaryWeaponSlot = this.inventoryItem._props.Slots.find(slot => slot._name === 'FirstPrimaryWeapon');
        const generatedWeapon = new primaryWeapon(this).generate(role, primaryWeaponSlot, equipment._id);

        if (!generatedWeapon) {
            console.error(`building FirstPrimaryWeapon stop, generatedWeapon is null`);
            return null;
        }

        return {items: generatedWeapon.items, weaponItem: generatedWeapon.weapon, magItem: generatedWeapon.magItem};
    }

    isContainRequiredSlots(slot) {
        if (slot._required) return true;
        if (slot._name === 'mod_handguard') return true;
        if (slot._name === 'mod_barrel') return true;
        if (slot._name === 'mod_magazine') return true;
        if (slot._name === 'mod_stock') return true;

        let slotFilters = slot._props.filters[0].Filter;

        for (let itemID of slotFilters) {
            let item = this.items[itemID];

            if (item._props.hasOwnProperty('Slots') && item._props.Slots.length > 0) {
                for (let itemSlot of item._props.Slots) {
                    if (this.isContainRequiredSlots(itemSlot))
                        return true;
                }
            }
        }

        return false;
    }

    // clean all non external mags from array
    filterMagsIDs(magIDs = []) {
        const result = [];
        for (let magID of magIDs) {
            let magItem = global.items.data[magID];

            if (magItem._props.ReloadMagType === 'ExternalMagazine') {
                result.push(magID);
            }
        }
        return result;
    }

    // get randomly weapon item by role
    getRandomWeaponByRole(role, slot) {
        const {weaponItems} = this.typesByRole[role][slot._name];
        return weaponItems[Math.floor(Math.random() * weaponItems.length)];
    }

    getWeaponSlot(weaponItem, slotName) {
        return weaponItem._props.Slots.find(slot => slot._name === slotName);
    }

    getFiltersBySlotName(weaponItem, slotName) {
        return this.getWeaponSlot(weaponItem, slotName)._props.filters[0].Filter;
    }

    getWeaponAmmoCaliber(weapon) {
        const {defAmmo} = weapon._props;
        const {Caliber: ammoCaliber} = this.items[defAmmo]._props;
        return ammoCaliber;
    }

    generateCartridgeForMag(parentID, {Cartridges}, ammoCaliber) {
        const ammoItem = this.getRandomAmmoByCaliber(ammoCaliber);

        return {
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": ammoItem._id,
            "parentId": parentID,
            "slotId": Cartridges[0]._name,
            "upd": {
                "StackObjectsCount": Cartridges[0]._max_count
            }
        };
    }

    generateAmmoStack(parentID, slotID, ammoCaliber) {
        const ammoItem = this.getRandomAmmoByCaliber(ammoCaliber);

        return {
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": ammoItem._id,
            "parentId": parentID,
            "slotId": slotID,
            "location": {
                "x": 0,
                "y": 0,
                "r": 0
            },
            "upd": {
                "StackObjectsCount": ammoItem._props.StackMaxSize
            }
        };
    }

    getRandomAmmoByCaliber(ammoCaliber) {
        const ammoItems = this.allAmmoItems.filter(item => ammoCaliber.startsWith(item._props.Caliber));
        return ammoItems[Math.floor(Math.random() * ammoItems.length)];
    }

    generateGrenade(parentID) {
        const grenadeItems = this.grenadeItems;
        const grenadeItem = grenadeItems[Math.floor(Math.random() * grenadeItems.length)];

        return {
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": grenadeItem._id,
            "parentId": parentID,
            "slotId": 'main',
            "location": {
                "x": 0,
                "y": 0,
                "r": 0
            }
        };
    }

    generateGrenadesForPockets(parentID, pocketsItem, max = 2) {
        const spawn = Math.floor(Math.random() * 100) > 30;
        if (!spawn) return [];

        const result = [];
        const grids = this.inventoryGenerator.getItemGrids(pocketsItem);
        const grenadesAmount = Math.floor(Math.random() * (max - 1)) + 1;

        for (let i = 0; i < grenadesAmount; i++) {
            let grenade = this.generateGrenade(parentID);
            let gridItem = grids[i];
            grenade.slotId = gridItem._name;

            result.push(grenade);
        }

        return result;
    }
}

// /client/game/bot/generate -> {"conditions":[{"Role":"assault","Limit":30,"Difficulty":"easy"},{"Role":"marksman","Limit":30,"Difficulty":"normal"},{"Role":"marksman","Limit":30,"Difficulty":"easy"},{"Role":"marksman","Limit":30,"Difficulty":"hard"},{"Role":"assault","Limit":30,"Difficulty":"normal"},{"Role":"assault","Limit":30,"Difficulty":"hard"}]}

module.exports.weapGenerator = new WeaponGenerator(global.items.data);

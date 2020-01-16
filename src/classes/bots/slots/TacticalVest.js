"use strict";

require('../../../libs.js');
const crypto = require('crypto');

module.exports = class TacticalVest {
    constructor(vestItems = []) {
        // all possible items of tactical vest
        this.vestItems = vestItems;
        // all slots in that tactical vest, used for checks on free slots
        this.slots = [];
        // random tactical vest
        this.item = null;
        // generated item for that tactical vest
        this.generatedVest = null;
        // all items in that tactical vest
        this.items = [];
        // maximum slots size by height and width
        this.MaxHV = {H: 0, V: 0};
        this.weaponGenerator = global.weaponGen;
    }

    generateVest(parentID) {
        this.item = this.vestItems[Math.floor(Math.random() * this.vestItems.length)];
        this.fillVariables();

        this.generatedVest = {
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": this.item._id,
            "parentId": parentID,
            "slotId": "TacticalVest"
        };
        this.items.push(this.generatedVest);
    }

    fillVariables() {
        const {Grids} = this.item._props;

        // get maximum value of horizontal and vertical for vest slots
        Grids.forEach(({_props: gridProperties}) => {
            if (gridProperties.cellsH > this.MaxHV.H) this.MaxHV.H = gridProperties.cellsH;
            if (gridProperties.cellsV > this.MaxHV.V) this.MaxHV.V = gridProperties.cellsV;
        });
    }

    putAmmunition(weaponItem, weaponMagItem) {
        // check if weapon magazine is external
        if (weaponMagItem._props.ReloadMagType === 'ExternalMagazine') {
            this.putMags(weaponItem);
        } else {
            this.putAmmo(weaponItem);
        }
    }

    putMags(weaponItem) {
        // filter items id's for available slots
        let weaponMagIDs = this.weaponGenerator.getFiltersBySlotName(weaponItem, 'mod_magazine');
        weaponMagIDs = this.filterItemsByMaxSize(weaponMagIDs);
        weaponMagIDs = this.weaponGenerator.filterMagsIDs(weaponMagIDs);
        const ammoCaliber = this.weaponGenerator.getWeaponAmmoCaliber(weaponItem);

        // get random value of count for mags
        let maxCartridgesCount = Math.floor(Math.random() * 2 + 1);

        while (0 < maxCartridgesCount--) {
            let randomMagID = weaponMagIDs[Math.floor(Math.random() * weaponMagIDs.length)];
            let weaponMagItem = global.items.data[randomMagID];
            if (!weaponMagItem || !weaponMagItem.hasOwnProperty('_props')) continue;

            let slotID = this.getFreeSlotIdForItem(weaponMagItem._props);

            // check if we have free slots for that mag
            if (typeof slotID === 'string') {
                let generatedMagItem = {
                    "_id": crypto.randomBytes(12).toString('hex'),
                    "_tpl": weaponMagItem._id,
                    "parentId": this.generatedVest._id,
                    "slotId": slotID,
                    "location": {"x": 0, "y": 0, "r": 0}
                };
                this.slots[slotID] = generatedMagItem;
                this.items.push(generatedMagItem);

                let magCartridge = this.weaponGenerator.generateCartridgeForMag(generatedMagItem._id, weaponMagItem._props, ammoCaliber);
                this.items.push(magCartridge);
            }
        }
    }

    putAmmo(weaponItem = {}) {
        const ammoCaliber = this.weaponGenerator.getWeaponAmmoCaliber(weaponItem);
        // get random value of count for cartridges
        let maxCartridgesCount = Math.floor(Math.random() * 4 + 1);

        while (0 < maxCartridgesCount--) {
            let slotID = this.getFreeSlotIdForItem({Width: 1, Height: 1});

            // check if we have free slots for that mag
            if (typeof slotID === 'string') {
                let cartridgeStack = this.weaponGenerator.generateAmmoStack(this.generatedVest._id, slotID, ammoCaliber);
                this.items.push(cartridgeStack);
                this.slots[slotID] = cartridgeStack;
            }
        }
    }

    // check if we can put items in that vest
    filterItemsByMaxSize(filters = []) {
        let result = [];

        filters.forEach(itemID => {
            let item = global.items.data[itemID];

            if (typeof this.getFreeSlotIdForItem(item._props) === 'string') {
                result.push(itemID);
            }
        });
        return result;
    }

    // input: item._props or {Width: 1, Height: 1}
    getFreeSlotIdForItem({Width, Height}) {
        const {Grids} = this.item._props;
        let slotID = null;

        // get free slot
        for (let slot of Grids) {
            let {_props: gridProperties} = slot;

            if (Width <= gridProperties.cellsH && Height <= gridProperties.cellsV) {
                if (!this.slots[slot._name]) {
                    slotID = slot._name;
                    break;
                }
            }
        }

        return slotID;
    }

    // input: item._props or {Width: 1, Height: 1}
    getFreeSlotIdBySize({Width, Height}) {
        const {Grids} = this.item._props;
        let slotID = null;

        // get free slot
        for (let slot of Grids) {
            let {_props: gridProperties} = slot;

            if (Width === gridProperties.cellsH && Height === gridProperties.cellsV) {
                if (!this.slots[slot._name]) {
                    slotID = slot._name;
                    break;
                }
            }
        }

        return slotID;
    }

    getItemsArray() {
        return this.items;
    }
};
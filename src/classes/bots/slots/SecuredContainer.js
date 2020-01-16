"use strict";

require('../../../libs.js');
const crypto = require('crypto');

module.exports = class SecuredContainer {
    constructor(weapon = {}) {
        // all items in that tactical vest
        this.items = [];
        // weapon item for generating ammo stacks
        this.weaponItem = weapon;
        this.weaponGenerator = global.weaponGen;
    }

    generateContainer(parentID) {
        this.item = global.items.data['5857a8bc2459772bad15db29'];

        this.items.push({
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": this.item._id,
            "parentId": parentID,
            "slotId": "SecuredContainer"
        });
        this.putAmmo();
    }

    putAmmo() {
        const ammoCaliber = this.weaponGenerator.getWeaponAmmoCaliber(this.weaponItem);
        const {Grids: [containerGrid]} = this.item._props;

        let [x, y] = [containerGrid._props.cellsH, containerGrid._props.cellsV];
        let gridSize = x * y;
        y -= 1;

        for (let i = 0; i < gridSize; i++) {
            let xSlot = i % x;

            let ammoStack = this.weaponGenerator.generateAmmoStack(this.items[0]._id, containerGrid._name, ammoCaliber);
            ammoStack.location.x = xSlot;
            ammoStack.location.y = y;
            this.items.push(ammoStack);

            if (xSlot >= 2) y--;
        }
    }
};
"use strict";

require('../../../libs.js');
const crypto = require('crypto');

module.exports = class ArmorVest {
    constructor() {
    }

    generate(parentID) {
        const allArmorVestItems = Object.values(global.items.data).filter(item => item._parent === '5448e54d4bdc2dcc718b4568');
        const randomArmorVest = allArmorVestItems[Math.floor(Math.random() * allArmorVestItems.length)];
        const randomDurability = Math.floor(Math.random() * randomArmorVest._props.MaxDurability);

        return {
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": randomArmorVest._id,
            "parentId": parentID,
            "slotId": "ArmorVest",
            "upd": {
                "Repairable": {
                    "Durability": randomDurability
                }
            }
        };
    }
};

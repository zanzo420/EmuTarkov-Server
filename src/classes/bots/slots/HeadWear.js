"use strict";

require('../../../libs.js');
const crypto = require('crypto');

module.exports = class HeadWear {
    constructor() {
    }

    generate(parentID, slot) {
        const slotFilters = slot._props.filters[0].Filter;
        const randomItemID = slotFilters[Math.floor(Math.random() * slotFilters.length)];
        let randomItem = global.items.data[randomItemID];

        const result = [{
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": randomItemID,
            "parentId": parentID,
            "slotId": "Headwear"
        }];

        result.push(...this.generateItemsForSlots(result[0]._id, randomItem._props));

        return result;
    }

    generateItemsForSlots(parentID, {Slots}, conflictingItemIDs = []) {
        const result = [];

        Slots.forEach(slot => {
            let isRequired = Math.random() >= 0.5;

            if (isRequired) {
                let slotFilters = slot._props.filters[0].Filter;
                let randomItemID = slotFilters[Math.floor(Math.random() * slotFilters.length)];

                if (conflictingItemIDs.includes(randomItemID)) return;

                let randomItem = global.items.data[randomItemID];
                if (!randomItem) return;
                
                let generatedItem = {
                    "_id": crypto.randomBytes(12).toString('hex'),
                    "_tpl": randomItem._id,
                    "parentId": parentID,
                    "slotId": slot._name
                };
                result.push(generatedItem);
                conflictingItemIDs.push(randomItem._props.ConflictingItems);

                result.push(...this.generateItemsForSlots(generatedItem._id, randomItem._props, conflictingItemIDs));
            }
        });

        return result;
    }
};
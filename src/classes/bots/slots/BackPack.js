"use strict";

require('../../../libs.js');
const crypto = require('crypto');

module.exports = class BackPack {
    constructor(backPackItems = [], lootNodes = []) {
        // all items
        this.itemsValues = Object.values(global.items.data);
        // all items in that object
        this.items = [];
        // all possible back pack items
        this.backPackItems = backPackItems;
        // all possible categories of loot
        this.lootNodes = lootNodes;

        // all slots in that back pack grid
        this.grid = [];
        this.gridName = null;

        // back pack grid size (cellsH = x, cellsV = y)
        this.cellsH = 0;
        this.cellsV = 0;
    }

    generate(parentID) {
        this.item = this.getBackPackRandomly(50);
        if (!this.item) return;

        this.selfID = crypto.randomBytes(12).toString('hex');
        this.items.push({
            "_id": this.selfID,
            "_tpl": this.item._id,
            "parentId": parentID,
            "slotId": "Backpack"
        });
        const {Grids: [grid]} = this.item._props;
        [this.gridName, this.cellsH, this.cellsV] = [grid._name, grid._props.cellsH, grid._props.cellsV];

        this.fillBackPackLoot();
    }

    getBackPackRandomly(chance = 50) {
        let spawn = chance > Math.floor(Math.random() * 100);
        if (!spawn) return null;

        let backPack = this.backPackItems[Math.floor(Math.random() * this.backPackItems.length)];
        if (backPack._props.SpawnChance <= 10) backPack._props.SpawnChance *= 15;
        spawn = Math.random() * 100 < backPack._props.SpawnChance;
        if (spawn) return backPack;

        return null;
    }

    fillBackPackLoot(maxLootAmount = 10) {
        let randomLootCount = Math.floor(Math.random() * maxLootAmount);

        while (randomLootCount-- > 0) {
            let randomNode = this.lootNodes[Math.floor(Math.random() * this.lootNodes.length)];
            let lootItem = this.getRandomlyItemFromNode(randomNode);
            this.putLootItem(lootItem);
        }
    }

    // put loot item to loot list
    putLootItem(lootItem) {
        if (!lootItem) return;

        let freePosition = this.getFreeSlotPosition(lootItem._props);
        if (freePosition.x < 0) return;

        let item = {
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": lootItem._id,
            "parentId": this.selfID,
            "slotId": this.gridName,
            "location": {
                "x": freePosition.x,
                "y": freePosition.y,
                "r": 0
            }
        };
        this.items.push(item);
    }

    // get free slot for item by width and height (x, y)
    getFreeSlotPosition({Width, Height}) {
        if (Width > this.cellsH || Height > this.cellsV) return {x: -1, y: -1};// size of item is too big

        for (let y = 0; y < this.cellsV; y++) {
            for (let x = 0; x < this.cellsH; x++) {

                // check on free slot and enough size
                if ((!this.grid[x] || !this.grid[x][y]) && (Width + x <= this.cellsH)) {
                    if (Height + y <= this.cellsV) {
                        this.fillGrid(x, y, Width, Height);
                        return {x, y};
                    }
                }
            }
        }

        return {x: -1, y: -1}; // no free slot
    }

    fillGrid(x, y, Width, Height) {
        for (let wIndex = 0; wIndex < Width; wIndex++) {
            if (!this.grid[x + wIndex]) this.grid[x + wIndex] = [];

            for (let hIndex = 0; hIndex < Height; hIndex++) {
                this.grid[x + wIndex][y + hIndex] = true;
            }
        }
    }

    getRandomlyItemFromNode(nodeItem = {}) {
        if (Math.random() * 100 < nodeItem._props.SpawnChance) return null;
        let childItems = this.itemsValues.filter(item => item._parent === nodeItem._id);
        let childItem = childItems[Math.floor(Math.random() * childItems.length)];

        if (childItem && childItem._type === 'Node')
            return this.getRandomlyItemFromNode(childItem);

        if (!childItem || childItem._props.QuestItem) return null;

        // check for an expensive item
        const {CreditsPrice, SpawnChance} = childItem._props;
        childItem._props.SpawnChance = (CreditsPrice > 50000) ? 10 : SpawnChance;

        if (Math.floor(Math.random() * 100) <= childItem._props.SpawnChance) return childItem;

        return null;
    }
};
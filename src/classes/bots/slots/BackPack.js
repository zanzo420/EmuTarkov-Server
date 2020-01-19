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

    getBackPackRandomly() {
        let backPack = this.backPackItems[Math.floor(Math.random() * this.backPackItems.length)];
        if (backPack._props.SpawnChance <= 10) backPack._props.SpawnChance *= 10;

        let spawn = Math.random() * 100 < backPack._props.SpawnChance;
        if (spawn) return backPack;

        return null;
    }

    fillBackPackLoot() {
        let randomLootCount = Math.floor(Math.random() * (this.cellsV * this.cellsH)) + (this.cellsV);

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

        const {StackMaxRandom} = lootItem._props;

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
        if (StackMaxRandom && StackMaxRandom > 1) {
            item.upd = {StackObjectsCount: Math.floor(Math.random() * StackMaxRandom)}
        }
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
        // check on excluded items\nodes
        if (this.isExcluded(nodeItem)) return null;

        let childItems = this.itemsValues.filter(item => item._parent === nodeItem._id);
        let childItem = childItems[Math.floor(Math.random() * childItems.length)];

        if (!childItem || childItem._props.QuestItem) return null;

        if (childItem && childItem._type === 'Node')
            return this.getRandomlyItemFromNode(childItem);

        // check for an expensive item
        const {CreditsPrice} = childItem._props;
        childItem._props.SpawnChance += 35;
        if (CreditsPrice > 50000) childItem._props.SpawnChance = 5;

        if (Math.floor(Math.random() * 100) <= childItem._props.SpawnChance) return childItem;

        return null;
    }

    isExcluded(item) {
        if (!item) return true;

        // exclude from loot a some things
        const excludeList = [
            '567849dd4bdc2d150f8b456e', // Map node
            '566abbb64bdc2d144c8b457d', // Stash node
            '55d720f24bdc2d88028b456d', // Inventory node
            '5447e0e74bdc2d3c308b4567', // SpecItem node
            '543be6564bdc2df4348b4568', // ThrowWeap node
            '566965d44bdc2d814c8b4571', // LootContainer node
            '5943d9c186f7745a13413ac9', // shrapnel item
        ];
        return excludeList.includes(item._id);
    }
};
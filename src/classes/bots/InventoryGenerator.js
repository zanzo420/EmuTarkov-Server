"use strict";

require('../../libs.js');
const crypto = require('crypto');
const vestObject = require('./slots/TacticalVest');
const armorVestObject = require('./slots/ArmorVest');
const headWearObject = require('./slots/HeadWear');
const securedContainerObject = require('./slots/SecuredContainer');
const backPackObject = require('./slots/BackPack');

class InventoryGenerator {
    constructor(items) {
        // create instance of that class only once
        if (InventoryGenerator.exists) return InventoryGenerator.instance;

        this.items = items;
        this.itemsValues = Object.values(items);
        this.weaponGenerator = null;
        this.fillVariables();

        InventoryGenerator.exists = true;
        InventoryGenerator.instance = this;
    }

    fillVariables() {
        this.inventoryItem = this.itemsValues.find(item => item._name === 'Default Inventory');
        this.pocketsItem = this.itemsValues.find(item => item._id === '557ffd194bdc2d28148b457f');
        this.medItems = this.itemsValues.filter(item => item._parent === '5448f39d4bdc2d0a728b4568'); // 5 items

        let vestNode = this.itemsValues.find(item => item._type === 'Node' && item._name === 'Vest');
        this.vestItems = this.itemsValues.filter(item => item._parent === vestNode._id);

        let backNode = this.itemsValues.find(item => item._type === 'Node' && item._name === 'Backpack');
        this.backPackItems = this.itemsValues.filter(item => item._parent === backNode._id);

        this.lootNodes = this.itemsValues.filter(item => item._parent === '54009119af1c881c07000029');

        this.grenadeItems = this.itemsValues.filter(item => item._parent === '543be6564bdc2df4348b4568');
    }

    generate(botBase = {Info: {Settings: {Role: 'assault'}}}) {
        const role = botBase.Info.Settings.Role;
        const isBoss = role.startsWith('boss');

        // not for long, soon we'll write loot generation for bosses too
        if (isBoss) return botBase.Inventory;

        const equipment = {
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": this.inventoryItem._id
        };
        const stash = {
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": "566abbc34bdc2d92178b4576" // need to play with it
        };
        const questRaidItems = {
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": "5963866286f7747bf429b572" // need to play with it
        };
        const questStashItems = {
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": "5963866286f7747bf429b572" // need to play with it
        };

        const generatedInventory = {
            items: [],
            equipment: null,
            stash: null,
            questRaidItems: null,
            questStashItems: null,
            fastPanel: {}
        };
        generatedInventory.items.push(equipment);
        generatedInventory.equipment = equipment._id;

        generatedInventory.items.push(stash);
        generatedInventory.stash = stash._id;

        generatedInventory.items.push(questRaidItems);
        generatedInventory.questRaidItems = questRaidItems._id;

        generatedInventory.items.push(questStashItems);
        generatedInventory.questStashItems = questStashItems._id;

        // generate weapon
        const generatedWeapon = this.generateWeapon(generatedInventory, equipment, botBase, isBoss);
        generatedInventory.items.push(...generatedWeapon.items);

        // generate tactical vest and fill into them ammunition
        const generatedVest = new vestObject(this.vestItems);
        generatedVest.generateVest(equipment._id);
        generatedVest.putAmmunition(generatedWeapon.weaponItem, generatedWeapon.magItem);
        generatedInventory.items.push(...generatedVest.getItemsArray());

        // if tactical vest was not blocking armor slot, then generating armor
        if (!generatedVest.item._props.BlocksArmorVest) {
            let generatedArmorVest = new armorVestObject().generate(equipment._id);
            generatedInventory.items.push(generatedArmorVest);
        }

        // head wear generation
        generatedInventory.items.push(...this.generateHeadWear(equipment));

        // generation for secured container, used for store ammo stacks
        let securedContainer = new securedContainerObject(generatedWeapon.weaponItem);
        securedContainer.generateContainer(equipment._id);
        generatedInventory.items.push(...securedContainer.items);

        // back pack generation
        let backPack = new backPackObject(this.backPackItems, this.lootNodes);
        backPack.generate(equipment._id);
        generatedInventory.items.push(...backPack.items);

        // generate pockets
        generatedInventory.items.push(...this.generatePockets(equipment));

        return generatedInventory;
    }

    generateWeapon(generatedInventory, equipment, botBase, isBoss = false) {
        this.weaponGenerator = global.weaponGen;
        return this.weaponGenerator.generatePrimaryWeaponSlot(botBase.Info.Settings.Role, equipment);
    }

    generatePockets(equipment) {
        const pocketsSlot = this.getInventorySlotByName('Pockets');
        const result = [{
            "_id": crypto.randomBytes(12).toString('hex'),
            "_tpl": this.pocketsItem._id,
            "parentId": equipment._id,
            "slotId": pocketsSlot._name
        }];

        result.push(...this.weaponGenerator.generateGrenadesForPockets(result[0]._id, this.pocketsItem, 3));

        const medAmount = Math.floor(Math.random() * (5 - result.length)) + 1;
        const meds = this.medItems.filter(item => item._props.Width === 1 && item._props.Height === 1);

        for (let i = 0; i < medAmount; i++) {
            let medItem = meds[Math.floor(Math.random() * meds.length)];
            let slotID = 'pocket' + (result.length);

            let med = {
                "_id": crypto.randomBytes(12).toString('hex'),
                "_tpl": medItem._id,
                "parentId": result[0]._id,
                "slotId": slotID,
                "location": {
                    "x": 0,
                    "y": 0,
                    "r": 0
                }
            };

            result.push(med);
        }
        return result;
    }

    generateHeadWear(equipment) {
        const headWearSlot = this.getInventorySlotByName('Headwear');
        return new headWearObject().generate(equipment._id, headWearSlot);
    }

    getInventorySlotByName(name) {
        let {Slots: inventorySlots} = this.inventoryItem._props;
        return inventorySlots.find(slot => slot._name === name);
    }

    getItemGrids(item) {
        let {Grids: grids} = item._props;
        return grids;
    }
}

module.exports.inventoryGen = new InventoryGenerator(global.items.data);
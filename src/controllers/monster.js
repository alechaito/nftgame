const { InventoryMonsters, Monsters } = require("../models/monster");
const Database = require("../config/db");
const { QueryTypes } = require("sequelize");
const UsersController = require("./user");
const Users = require("../models/user");
const RewardController = require("./reward");
const Helper = require("./helper");

const { randomBytes } = require("crypto");

var wallet = "0x6C3CF1365a872915D8F6ab03C89326F28C8a146c";

const getAllByUserId = async (id_user) => {
    return await Database.query(
        `SELECT m.name, m.image, m.rarity, im.feed, im.exp, im.level, im.id FROM inventory_monsters im
        INNER JOIN monsters m ON m.id = im.id_monster
        WHERE im.id_user = :id_user`,
        {
            replacements: { id_user: id_user },
            type: QueryTypes.SELECT,
        }
    );
};

const viewAll = async (req, res) => {
    let user = await UsersController.getByWallet(wallet);
    let myMonsters = await getAllByUserId(user.id);
    //let rewards = await RewardController.getRewardsByWallet(wallet);
    return res.render("mymonsters.ejs", {
        monsters: myMonsters,
        user: user,
    });
};

const getLevel = async (exp, lvl) => {
    var nextlvl = lvl * 1000 - exp;
    console.log("nextlvl", nextlvl);
    return Math.trunc(exp / 1000) + 1;
};

const getInventoryMonsterByID = async (id) => {
    try {
        return await InventoryMonsters.findOne({ where: { id: id } });
    } catch (error) {
        console.log(error);
        return null;
    }
};

const feed = async (req, res) => {
    let { uuid, wallet } = req.body;

    let instance = await getInventoryMonsterByID(uuid);
    //console.log("instance", instance);
    if (instance.feed == false) {
        let user = await UsersController.getByInventoryMonsterUUID(uuid);
        console.log("usuario", user);
        console.log(user.elixir);
        if (user && user.elixir > 0) {
            console.log("nao e null");
            //await RewardController.giveReward(instance, user.wallet);
            await UsersController.increaseElixir(user.wallet, -1);
            // feed and set exp
            console.log("instance id monster", instance.id_monster);
            let monster = await Monsters.findOne({
                where: { id: instance.id_monster },
            });
            let newexp = instance.exp + (await getExpByRarity(monster.rarity));
            //let level = await getLevel(newexp, instance.level);
            let resultFeed = await instance.update({
                feed: true,
            });
        }
    } else {
        console.log("[LOG] Monster not hungry..");
        let resultFeed = await instance.update({ feed: false });
        //console.log("result update", resultFeed.dataValues.id);
    }

    return res.redirect("/monster/view/all");
};

const getEggPrice = async () => {
    return 1;
};

const mintEgg = async (req, res) => {
    try {
        let { wallet } = req.body;
        // check params
        if (!Helper.validParam(wallet)) {
        }
        //-----------------------
        let eggPrice = await getEggPrice();
        let user = await UsersController.getByWallet(wallet);
        console.log(user.balance);
        console.log(eggPrice);
        if (user && user.balance >= eggPrice) {
            let result = await UsersController.increaseBalanceByWallet(wallet, -eggPrice);
            let rarity = await randomRarity();
            let monster = await getRandomMonster(rarity);
            if (result && monster != null) {
                await createInventoryMonster(wallet, monster);
            }
        }
        return res.redirect("/account/manage");
    } catch (error) {
        console.log(error);
        return res.redirect("/account/manage");
    }
};

const createInventoryMonster = async (wallet, monster) => {
    try {
        let user = await UsersController.getByWallet(wallet);
        if (user) {
            let result = await InventoryMonsters.create({
                id_monster: monster.id,
                feed: 0,
                id_user: user.id,
            });
        }
    } catch (error) {
        console.log(error);
        return null;
    }
};

const randomRarity = async () => {
    let randomNumber = await Helper.getRandomNumber(0, 100);
    if (randomNumber >= 0 && randomNumber < 89) {
        return "common";
    } else if (randomNumber >= 89 && randomNumber < 99) {
        return "rare";
    } else if (randomNumber >= 99) {
        return "epic";
    }
};

const getRandomMonster = async (type) => {
    try {
        let monsters = await Monsters.findAll({ where: { rarity: type } });
        let randomNumber = await Helper.getRandomNumber(0, monster.length);
        return monsters[randomNumber];
    } catch (error) {
        console.log(error);
        return null;
    }
};

const update = async (req, res) => {
    try {
        let { monster_id, wallet } = req.body;
        let updateCost = 300;
        let myMonster = await InventoryMonsters.findOne({ where: { id: monster_id } });

        if (!myMonster) {
            throw new Error(`Cannot find this monster with id: ${monster_id} `);
        }

        let user = await Users.findOne({ where: { wallet: wallet } });
        if (user.id != myMonster.id_user) {
            throw new Error(`Players is not owner of this monster, possible try to hack.`);
        }

        if (parseFloat(user.balance) < updateCost) {
            throw new Error(`User balance is not enough to update monster: ${user.balance}.`);
        }

        let nextLevel = parseFloat(myMonster.level) + 1;
        let experienceToNextLevel = parseFloat(nextLevel * 1000);

        if (parseFloat(myMonster.exp) < experienceToNextLevel) {
            throw new Error(`Monster doenst not have experience necessary to next lvl.`);
        }

        // its all ok, lets upgrade monster to the next level
        await myMonster.update({ level: nextLevel });
        await UsersController.increaseBalanceByWallet(wallet, -updateCost);
        console.log(`Ok, monster upgrade to level ${nextLevel}`);
        return res.redirect("/monster/view/all");
    } catch (error) {
        console.log(error);
        return res.redirect("/monster/view/all");
    }
};

module.exports = {
    viewAll,
    feed,
    getInventoryMonsterByID,
    mintEgg,
    update,
};

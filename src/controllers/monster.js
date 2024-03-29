const Monsters = require("../models/monster");
const InventoryMonsters = require("../models/inventory_monster");
const Database = require("../config/db");
const { QueryTypes } = require("sequelize");
const UsersController = require("./user");
const Users = require("../models/user");
const Helper = require("./helper");
const CMNFT = require("./CMNFT.json");
const ethers = require("ethers");

var wallet = "0x6C3CF1365a872915D8F6ab03C89326F28C8a146c";

const viewAll = async (req, res) => {
    return res.render("mymonsters.ejs", {
        abi: CMNFT.abi,
    });
};

const getABI = async (req, res) => {
    return res.json(CMNFT.abi);
};

const getAll = async (req, res) => {
    let { wallet } = req.body;
    var user = await UsersController.getByWallet(wallet);
    if (!user) {
        user = await Users.create({
            wallet: wallet,
            balance: 0,
            elixir: 0,
        });
        console.log("User not exist, created");
    }

    let monsters = await getAllByUserId(user.id);
    /*let monsterBalance = await checkMonsterBalance(wallet);
    if (monsters.length < monsterBalance) {
        await mint(wallet);
    } else {
        console.log("max atingido");
    }*/
    return res.json(monsters);
};

const checkMonsterBalance = async (wallet) => {
    var provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
    let contract = new ethers.Contract(
        "0xeC237071970A7a714b3AC13ce6eC6Ccd6b2d9ce6",
        CMNFT.abi,
        provider
    );
    let result = await contract.addressMintedBalance(wallet);
    return parseInt(result._hex, 16);
};

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

const getInventoryMonsterByID = async (id) => {
    try {
        return await InventoryMonsters.findOne({ where: { id: id } });
    } catch (error) {
        console.log(error);
        return null;
    }
};

const feed = async (req, res) => {
    try {
        let { uuid } = req.body;

        let instance = await getInventoryMonsterByID(uuid);

        if (!instance) throw new Error(`Cannot get monster instance.`);
        if (instance.feed) throw new Error(`Monster not hungry.`);

        let user = await UsersController.getByInventoryMonsterUUID(uuid);
        let userWallet = await Users.findOne({ where: { wallet: wallet } });

        console.log("usuario", user);
        console.log(user.elixir);

        if (!user) throw new Error(`Cannot get user.`);
        if (!userWallet) throw new Error(`Cannot get user wallet.`);
        if (user.id != userWallet.id) throw new Error(`That monster is not yours.`);
        if (user.elixir <= 0) throw new Error(`Didnt have elixir, please buy.`);

        await UsersController.increaseElixir(user.wallet, -1);

        await instance.update({
            feed: true,
        });

        console.log("All right, monster feeded.");
        return res.redirect("/monster/view/all");
    } catch (error) {
        console.log(error);
        return res.redirect("/monster/view/all");
    }
};

const mint = async (wallet) => {
    let mintedMonster = await getRandomMonster();

    if (!mintedMonster) {
        throw new Error(`Error on mint monster, get random function.`);
    }

    /*let result = await UsersController.increaseBalanceByWallet(wallet, -eggCost);

    if (!result) {
        throw new Error(`Error on deduce balance to ming egg.`);
    }*/

    await createInventoryMonster(wallet, mintedMonster);
};

const mintEgg = async (req, res) => {
    try {
        let { wallet } = req.body;
        let eggCost = 1;
        // check params
        if (!Helper.validParam(wallet)) {
            throw new Error(`Input wallet is not valid.`);
        }
        let user = await UsersController.getByWallet(wallet);
        if (!user) {
            throw new Error(`User with this wallet not exit.`);
        }

        /*if (user.balance < eggCost) {
            throw new Error(`User balance is not enough to buy egg.`);
        }*/

        let mintedMonster = await getRandomMonster();

        if (!mintedMonster) {
            throw new Error(`Error on mint monster, get random function.`);
        }

        /*let result = await UsersController.increaseBalanceByWallet(wallet, -eggCost);

        if (!result) {
            throw new Error(`Error on deduce balance to ming egg.`);
        }*/

        await createInventoryMonster(wallet, mintedMonster);

        return res.redirect("/monster/all");
    } catch (error) {
        console.log(error);
        return res.redirect("/monster/all");
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

const getRandomMonster = async () => {
    try {
        let rarity = await randomRarity();
        rarity = "common";
        console.log(`Rarity ${rarity}`);
        let monsters = await Monsters.findAll({ where: { rarity: rarity } });
        let randomNumber = await Helper.getRandomNumber(1, monsters.length - 1);
        return monsters[randomNumber - 1];
    } catch (error) {
        console.log(error);
        return null;
    }
};

const getUpdateCost = async (level) => {
    switch (level) {
        case 2:
            return 300;
        case 3:
            return 450;
        case 4:
            return 675;
        case 5:
            return 1012;
        case 6:
            return 1518;
        case 7:
            return 2278;
        case 8:
            return 3417;
        case 9:
            return 5125;
        case 10:
            return 7688;
    }
};

const update = async (req, res) => {
    try {
        let { monster_id, wallet } = req.body;

        let myMonster = await InventoryMonsters.findOne({ where: { id: monster_id } });

        if (!myMonster) {
            throw new Error(`Cannot find this monster with id: ${monster_id} `);
        }

        let user = await Users.findOne({ where: { wallet: wallet } });
        if (user.id != myMonster.id_user) {
            throw new Error(`Players is not owner of this monster, possible try to hack.`);
        }

        let nextLevel = parseFloat(myMonster.level) + 1;
        let experienceToNextLevel = parseFloat(nextLevel * 1000);
        let updateCost = await getUpdateCost(nextLevel);

        if (parseFloat(user.balance) < updateCost) {
            throw new Error(`User balance is not enough to update monster: ${user.balance}.`);
        }

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
    getAll,
    getABI,
};

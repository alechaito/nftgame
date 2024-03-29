const Monsters = require("../models/monster");
const InventoryMonsters = require("../models/inventory_monster");
const { randomTokenReward, getExpByRarity, giveTokenReward } = require("./reward");
const Helper = require("./helper");
const Users = require("../models/user");
const Logs = require("./log");

var wallet = "0x6C3CF1365a872915D8F6ab03C89326F28C8a146c";

var quests = [
    { lvl_min: 0, lvl_max: 5, gas: 300, reward_min: 5, reward_max: 25, success: 81 },
    { lvl_min: 6, lvl_max: 10, gas: 450, reward_min: 7, reward_max: 37, success: 81 },
    { lvl_min: 11, lvl_max: 20, gas: 675, reward_min: 10, reward_max: 55, success: 81 },
];

const getQuestInfos = async (idx_quest, level) => {
    try {
        let questInfo = quests[idx_quest];
        console.log(`my level: ${level}, min: ${questInfo.lvl_min}, max: ${questInfo.lvl_max}`);
        // we check if monster has level to participate in this quest
        if (level >= questInfo.lvl_min && level <= questInfo.lvl_max) {
            return questInfo;
        }
        return false;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const isSuccess = async (percentage) => {
    let randomNumber = await Helper.getRandomNumber(0, 100);
    console.log("Random number", randomNumber);
    // percentage is the tax of success of quest
    if (randomNumber > percentage) {
        return false;
    }
    return true;
};

const start = async (req, res) => {
    try {
        let { monster_id, quest_id } = req.body;

        let myMonster = await InventoryMonsters.findOne({
            where: { id: monster_id },
        });

        let user = await Users.findOne({ where: { id: myMonster.id_user, wallet: wallet } });
        if (!user) {
            throw new Error("Player is not owner of this monster.");
        }

        // check if monster of user is able to start this dungeon based on level
        let questInfo = await getQuestInfos(quest_id, myMonster.level);
        if (questInfo == false) {
            throw new Error("The monster does not have the required minimum level.");
        }

        if (myMonster.feed == 0) {
            throw new Error("Monster are hungry, please feed it.");
        }

        // first dungeon comes with null value and not check delta_days
        if (myMonster.last_dungeon != null) {
            let deltaDays = await Helper.getDeltaTimeFromNow(myMonster.last_dungeon);

            if (deltaDays < 1) {
                throw new Error("You need to wait 24 hours to start a quest.");
            }
        }

        let expReward = await getExpByRarity(monster.rarity);
        console.log("exp reward", expReward);
        if (!(await isSuccess(questInfo.success))) {
            // updating date of last dungeon
            await myMonster.update({ last_dungeon: new Date() });
            // setting exp even fail
            await myMonster.update({ exp: parseFloat(myMonster.exp) + parseFloat(expReward) });
            throw new Error("You have failed to complet the quest.");
        }

        // All things are checked and if we are here we can give rewards
        console.log("Quest success...");
        // getting token reward based on dungeon
        let tokenReward = await randomTokenReward(questInfo.reward_min, questInfo.reward_max);
        console.log("token reward", tokenReward);
        // getting exp reward by rarity and table
        let monster = await Monsters.findOne({ where: { id: myMonster.id_monster } });
        // save on database rewards gained
        // setting tokens to balance
        await giveTokenReward(myMonster, tokenReward, user.wallet);
        // setting new monster exp
        await myMonster.update({ exp: parseFloat(myMonster.exp) + parseFloat(expReward) });

        await Logs.insert({
            type: "Dungeon",
            status: "Success",
            tokens: tokenReward,
            exp: expReward,
            note: `Dungeon success with Monster #${myMonster.id}.`,
            transaction: "",
            wallet: user.wallet,
        });
        // updating date of last dungeon
        await myMonster.update({ last_dungeon: new Date() });
        return res.redirect("/monster/view/all");
    } catch (error) {
        console.log(error);
        return res.redirect("/monster/view/all");
    }
};

module.exports = { start };

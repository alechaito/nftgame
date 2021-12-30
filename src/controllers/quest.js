const {InventoryMonsters, Monsters} = require("../models/monster");
const {randomTokenReward, getExpByRarity, giveTokenReward} = require("./reward");
const Helper = require("./helper");
const Users = require("../models/user");

var wallet = "0x6C3CF1365a872915D8F6ab03C89326F28C8a146c";

var quests = [
    {lvl_min: 0, lvl_max: 5, gas: 300, reward_min: 3, reward_max: 10, success: 81},
    {lvl_min: 6, lvl_max: 10, gas: 300, reward_min: 6, reward_max: 15, success: 81},
    {lvl_min: 11, lvl_max: 20, gas: 300, reward_min: 9, reward_max: 20, success: 81},
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
        let {monster_id, quest_id} = req.body;
        let myMonster = await InventoryMonsters.findOne({
            where: {id: monster_id},
        });

        let user = await Users.findOne({where: {id: myMonster.id_user, wallet: wallet}});
        if (!user) {
            console.log("Player is not owner of this monster.");
            return res.redirect("/monster/view/all");
        }

        // check if monster of user is able to start this dungeon based on level
        let questInfo = await getQuestInfos(quest_id, myMonster.level);
        if (questInfo == false) {
            console.log("The monster does not have the required minimum level.");
            return res.redirect("/monster/view/all");
        }

        if (myMonster.feed == 0) {
            console.log("Monster are hungry and connot start a dungeon, please feed it.");
            return res.redirect("/monster/view/all");
        }

        if (!(await isSuccess(questInfo.success))) {
            console.log("You have failed to complet the quest.");
            return res.redirect("/monster/view/all");
        }

        // All things are checked and if we are here we can give rewards
        console.log("Quest success...");
        // getting token reward based on dungeon
        let tokenReward = await randomTokenReward(questInfo.reward_min, questInfo.reward_max);
        console.log("token reward", tokenReward);
        // getting exp reward by rarity and table
        let monster = await Monsters.findOne({where: {id: myMonster.id_monster}});
        let expReward = await getExpByRarity(monster.rarity);
        console.log("exp reward", expReward);
        // save on database rewards gained
        // setting tokens to balance
        await giveTokenReward(myMonster, tokenReward, user.wallet);
        // setting new monster exp
        await myMonster.update({exp: parseFloat(myMonster.exp) + parseFloat(expReward)});
        return res.redirect("/monster/view/all");
    } catch (error) {
        console.log(error);
        return res.redirect("/monster/view/all");
    }
};

module.exports = {start};

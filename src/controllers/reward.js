const { increaseBalanceByWallet } = require("./user");

const Rewards = require("../models/reward");
const { getRandomNumber } = require("./helper");

const calculateReward = async (rarity) => {
    let tokenPrice = await getTokenPrice();
    console.log(tokenPrice);
    return 1;
};

const randomTokenReward = async (min, max) => {
    return await getRandomNumber(min, max);
};

const getRewardsByWallet = async (wallet) => {
    return await Rewards.findAll({ where: { wallet: wallet, claimed: false } });
};

const giveTokenReward = async (monster, amount, wallet) => {
    try {
        let reward = await insertByInventoryMonster(monster, amount);
        if (reward != null) {
            console.log("reward amount", reward.amount);
            let result = await increaseBalanceByWallet(wallet, parseFloat(reward.amount));
            return true;
        }
        return null;
    } catch (error) {
        console.log(error);
        return null;
    }
};

const insertByInventoryMonster = async (monster, amount) => {
    try {
        let reward = await Rewards.create({
            id_monster: monster.id,
            amount: amount,
            claimed: true,
        });
        return reward;
    } catch (error) {
        console.log(error);
        return null;
    }
};

const getExpByRarity = async (rarity) => {
    console.log("rarity", rarity);
    switch (rarity) {
        case "common":
            return 25;
        case "rare":
            return 33.3;
        case "epic":
            return 40;
    }
    return 25;
};

module.exports = {
    insertByInventoryMonster,
    giveTokenReward,
    getRewardsByWallet,
    randomTokenReward,
    getExpByRarity,
};

const Logs = require("../models/log");

const insert = async (logInfo) => {
    try {
        let { type, status, tokens, exp, note, transaction, wallet } = logInfo;
        await Logs.create({
            type: type,
            status: status,
            tokens: tokens,
            exp: exp,
            note: note,
            transaction: transaction,
            wallet: wallet,
        });
        console.log(`Log created ${logInfo}`);
    } catch (error) {
        console.log(error);
    }
};

const getAllByWallet = async (wallet) => {
    try {
        let result = await Logs.findAll({ where: { wallet: wallet } });
        return result;
    } catch (error) {
        console.log(error);
        return [];
    }
};

module.exports = { insert, getAllByWallet };

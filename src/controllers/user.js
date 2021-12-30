const Database = require("../config/db");
const { QueryTypes } = require("sequelize");

const Users = require("../models/user");
//const RewardController = require("./reward");
const Helper = require("./helper");
const Logs = require("./log");

var wallet = "0x6C3CF1365a872915D8F6ab03C89326F28C8a146c";

//views
const accountView = async (req, res) => {
    let user = await getByWallet(wallet);
    let logs = await Logs.getAllByWallet(wallet);
    return res.render("account.ejs", {
        user,
        logs,
    });
};
//===========================

const getByWallet = async (wallet) => {
    return await Users.findOne({ where: { wallet: wallet } });
};

const getByInventoryMonsterUUID = async (uuid) => {
    try {
        let result = await Database.query(
            `SELECT u.id, u.wallet, u.balance, u.elixir FROM users u
            INNER JOIN inventory_monsters im ON im.id_user = u.id
            WHERE im.id = :uuid limit 1;`,
            {
                replacements: { uuid: uuid },
                type: QueryTypes.SELECT,
            }
        );
        if (result) {
            return result[0];
        }
        return null;
    } catch (error) {
        console.log(error);
        return null;
    }
};

const getBalanceByWallet = async (wallet) => {
    let user = await getByWallet(wallet);
    return user.balance;
};

const increaseBalanceByWallet = async (wallet, amount) => {
    try {
        let user = await getByWallet(wallet);
        if (user) {
            let result = await user.update({ balance: user.balance + amount });
            if (result) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.log(error);
    }
};

const getElixirPrice = async () => {
    return 1;
};

const buyElixir = async (req, res) => {
    try {
        let { wallet, amount } = req.body;
        amount = parseInt(amount);
        // check params
        if (!Helper.validParam(wallet)) return res.redirect("/monster/view/all");
        if (!Helper.validParam(amount)) return res.redirect("/monster/view/all");
        if (typeof amount != "number") return res.redirect("/monster/view/all");
        if (amount <= 0) return res.redirect("/monster/view/all");
        //--------------------------------------------
        let total = (await getElixirPrice()) * amount;
        let balance = await getBalanceByWallet(wallet);
        console.log("balance", balance);
        console.log("total", total);
        if (balance >= total && amount > 0) {
            let result = await increaseBalanceByWallet(wallet, -total);
            console.log("result", result);
            if (result) {
                await increaseElixir(wallet, amount);
                console.log("Elixir comprado com sucesso");
            }
        }
        return res.redirect("/monster/view/all");
    } catch (error) {
        console.log(error);
        return res.redirect("/monster/view/all");
    }
};

const increaseElixir = async (wallet, amount) => {
    try {
        amount = parseInt(amount);
        console.log("elixir amount", amount);
        // check params
        if (!Helper.validParam(wallet)) return res.redirect("/monster/view/all");
        if (!Helper.validParam(amount)) return res.redirect("/monster/view/all");
        if (typeof amount != "number") return res.redirect("/monster/view/all");
        //-----------------------
        let user = await getByWallet(wallet);
        if (user) {
            await user.update({ elixir: user.elixir + amount });
        }
    } catch (error) {
        console.log(error);
    }
};

const deposit = async (req, res) => {
    try {
        let { wallet, amount } = req.body;

        let result = await increaseBalanceByWallet(wallet, parseFloat(amount));
        return res.redirect("/account/manage");
    } catch (error) {
        console.log(error);
        return null;
    }
};

const getWithdrawTimeDiffInDays = async (lastWidthaw) => {
    try {
        let now = parseInt(new Date().getTime());
        let withdrawTime = parseInt(lastWidthaw.getTime());
        return Math.floor((now - withdrawTime) / 1000 / 60 / 60 / 24);
    } catch (error) {
        console.log(error);
        return 0;
    }
};

const withdraw = async (req, res) => {
    try {
        let { wallet, amount } = req.body;
        let user = await getByWallet(wallet);
        if (user) {
            let daysDiff = await getWithdrawTimeDiffInDays(user.last_withdraw);
            console.log("days", daysDiff);
            // check if last withdraw has 5 days and if user balance is higger
            if (daysDiff >= 5 && parseFloat(user.balance) >= parseFloat(Math.abs(amount))) {
                // removing balance from user account
                let result = await increaseBalanceByWallet(wallet, parseFloat(amount));
                console.log("Withdraw with success...");
                // updating last withdraw date
                user.update({ last_withdraw: new Date() });
            } else {
                console.log(`Error on withdraw...`);
            }
        }
        return res.redirect("/account/manage");
    } catch (error) {
        console.log(error);
        return null;
    }
};

module.exports = {
    getByWallet,
    increaseBalanceByWallet,
    getByInventoryMonsterUUID,
    accountView,
    buyElixir,
    increaseElixir,
    deposit,
    withdraw,
};

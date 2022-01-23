const Database = require("../config/db");
const { QueryTypes } = require("sequelize");
const Users = require("../models/user");
const Helper = require("./helper");
const Logs = require("./log");
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");

var wallet = "0x6C3CF1365a872915D8F6ab03C89326F28C8a146c";

//views
const accountView = async (req, res) => {
    let user = await getByWallet(wallet);
    let logs = await Logs.getAllByWallet(wallet);
    let daysDiff = await Helper.getDeltaTimeFromNow(user.last_withdraw);
    let withdraw_fee = await getFeeByDays(daysDiff);
    return res.render("account.ejs", {
        user,
        logs,
        withdraw_fee,
    });
};
//===========================

const getOrCreteByWallet = async (req, res) => {
    try {
        let { wallet } = req.body;
        var user = await getByWallet(wallet);
        if (!user) {
            let nonce = await Helper.getNonce();

            user = await Users.create({
                wallet: wallet,
                nonce: nonce,
                balance: 0,
                elixir: 0,
            });
        }
        return res.json(user);
    } catch (error) {
        console.log(error);
        return null;
    }
};

const sign = async (req, res) => {
    try {
        let { wallet, signature } = req.body;
        let user = await getByWallet(wallet);
        if (!user) {
            throw new Error(`Cannot get user to sign.`);
        }

        const msg = `I am signing my OTP: ${user.nonce}`;
        const address = await ethers.utils.verifyMessage(msg, signature);
        console.log(address);
        if (address.toLowerCase() === wallet.toLowerCase()) {
            user.nonce = await Helper.getNonce();
            user.save();
        } else {
            throw new Error(`Invalid signature.`);
        }
        const token = jwt.sign({ wallet }, process.env.JWT, {
            expiresIn: 300, // expires in 5min
        });

        console.log("token", token);

        return res.json(token);
    } catch (error) {
        console.log(error);
        return res.status(400).json(error);
    }
};

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

const buyElixir = async (req, res) => {
    try {
        let { wallet, amount } = req.body;
        amount = parseFloat(amount);
        let elixirCost = 1;
        // check params
        if (!Helper.validParam(wallet)) throw new Error(`Invalid wallet.`);
        if (!Helper.validParam(amount)) throw new Error(`Invalid amount.`);
        if (typeof amount != "number") throw new Error(`Invalid amount type.`);
        if (amount <= 0) throw new Error(`Invalid amount.`);
        //--------------------------------------------
        let totalCost = elixirCost * amount;
        let balance = await getBalanceByWallet(wallet);

        if (balance < totalCost) throw new Error(`Insuficient balance to buy elixir.`);

        let result = await increaseBalanceByWallet(wallet, -totalCost);

        if (!result) throw new Error(`Cannot deduce amount from wallet ${wallet}.`);

        await increaseElixir(wallet, amount);
        console.log("Elixir comprado com sucesso");

        await Logs.insert({
            type: "Buy Elixir",
            status: "Success",
            tokens: amount,
            exp: null,
            note: `Bought ${amount} elixirs for ${totalCost}`,
            transaction: "",
            wallet: wallet,
        });

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
        if (!Helper.validParam(wallet)) throw new Error(`Invalid wallet.`);
        if (!Helper.validParam(amount)) throw new Error(`Invalid amount.`);
        if (typeof amount != "number") throw new Error(`Invalid amount type.`);
        //-----------------------

        let user = await getByWallet(wallet);
        if (!user) throw new Error(`User not exist.`);

        await user.update({ elixir: parseFloat(user.elixir) + amount });
    } catch (error) {
        console.log(error);
    }
};

const deposit = async (req, res) => {
    try {
        let { wallet, amount } = req.body;

        if (!Helper.validParam(wallet)) throw new Error(`Invalid wallet.`);
        if (!Helper.validParam(amount)) throw new Error(`Invalid amount.`);
        if (typeof amount != "number") throw new Error(`Invalid amount type.`);

        amount = parseFloat(amount);
        if (parseFloat(amount) <= 0) throw new Error(`Invalid deposit amount.`);

        await increaseBalanceByWallet(wallet, parseFloat(amount));

        await Logs.insert({
            type: "Deposit",
            status: "Pending",
            tokens: amount,
            exp: null,
            note: `Deposit ${amount} CMTO`,
            transaction: "",
            wallet: wallet,
        });

        return res.redirect("/account/manage");
    } catch (error) {
        console.log(error);
        return null;
    }
};

const getFeeByDays = async (days) => {
    try {
        switch (days) {
            case 6:
                return 0.1;
            case 5:
                return 0.2;
            case 4:
                return 0.3;
            case 3:
                return 0.4;
            case 2:
                return 0.5;
            case 1:
                return 0.6;
            case 0:
                return 0.7;
            default:
                return 0.05;
        }
        return null;
    } catch (error) {
        console.log(error);
        return null;
    }
};

const getTotalWithdraw = async (amount, days) => {
    try {
        console.log(days);
        let fee = await getFeeByDays(days);
        if (fee == null) throw new Error(`Invalid fee.`);
        console.log(fee);
        return parseFloat(amount) - parseFloat(amount) * parseFloat(fee);
    } catch (error) {
        console.log(error);
        return null;
    }
};

const withdraw = async (req, res) => {
    try {
        let { wallet, amount } = req.body;

        if (!Helper.validParam(wallet)) throw new Error(`Invalid wallet.`);
        if (!Helper.validParam(amount)) throw new Error(`Invalid amount.`);
        if (typeof amount != "number") throw new Error(`Invalid amount type.`);

        amount = parseFloat(amount);
        if (parseFloat(amount) <= 0) throw new Error(`Invalid withdraw amount.`);
        if (parseFloat(amount) > 200) throw new Error(`Invalid withdraw amount, max 200.`);

        let user = await getByWallet(wallet);

        if (!user) throw new Error(`User not exist.`);

        if (parseFloat(user.balance) < parseFloat(amount)) {
            throw new Error(`Withdraw amount higger than user balance.`);
        }

        let daysDiff = await Helper.getDeltaTimeFromNow(user.last_withdraw);
        console.log("days_diff", daysDiff);
        if (daysDiff < 1) throw new Error(`Need to wait 24 hours to withdraw.`);

        let totalWithdraw = await getTotalWithdraw(amount, daysDiff);

        if (totalWithdraw == null) throw new Error(`Cannot get fee value.`);

        // removing balance from user account
        let result = await increaseBalanceByWallet(wallet, parseFloat(-amount));
        console.log("Withdraw with success...");
        // updating last withdraw date
        user.update({ last_withdraw: new Date() });

        await Logs.insert({
            type: "Withdraw",
            status: "Pending",
            tokens: amount,
            exp: null,
            note: `Withdraw ${amount} and receive ${totalWithdraw}`,
            transaction: "",
            wallet: user.wallet,
        });

        return res.redirect("/account/manage");
    } catch (error) {
        console.log(error);
        return res.redirect("/account/manage");
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
    getOrCreteByWallet,
    sign,
};

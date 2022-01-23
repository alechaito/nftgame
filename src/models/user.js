const Sequelize = require("sequelize");
const database = require("../config/db");

const Users = database.define("users", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    wallet: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    nonce: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    balance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    elixir: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    last_withdraw: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
});

module.exports = Users;

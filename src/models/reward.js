const Sequelize = require("sequelize");
const database = require("../config/db");

const Rewards = database.define("rewards", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    id_monster: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
    },
    claimed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
});

module.exports = Rewards;

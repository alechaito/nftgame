const Sequelize = require("sequelize");
const database = require("../config/db");

const Logs = database.define("logs", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    type: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    status: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    tokens: {
        type: Sequelize.FLOAT,
        allowNull: false,
    },
    exp: {
        type: Sequelize.FLOAT,
        allowNull: false,
    },
    note: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    transaction: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    wallet: {
        type: Sequelize.STRING,
        allowNull: false,
    },
});

module.exports = Logs;

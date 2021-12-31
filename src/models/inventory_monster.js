const Sequelize = require("sequelize");
const database = require("../config/db");

const InventoryMonsters = database.define("inventory_monsters", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    id_user: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    id_monster: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    feed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    exp: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    last_dungeon: {
        type: Sequelize.DATE,
        allowNull: null,
        defaultValue: null,
    },
});

module.exports = InventoryMonsters;

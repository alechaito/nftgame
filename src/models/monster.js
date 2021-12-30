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
});

const Monsters = database.define("monsters", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    rarity: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    image: {
        type: Sequelize.STRING,
        allowNull: true,
    },
});

module.exports = { InventoryMonsters, Monsters };

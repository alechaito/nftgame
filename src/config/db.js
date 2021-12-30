require("dotenv").config();
const Sequelize = require("sequelize");
const database = new Sequelize(process.env.DB_TABLE, process.env.DB_USER, process.env.DB_PASS, {
    dialect: "mysql",
    host: process.env.DB_HOST,
    logging: false,
});

//database.sync({ alter: true });

module.exports = database;

//const Users = require("../models/user");

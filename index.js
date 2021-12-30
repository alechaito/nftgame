require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");

const monsterRoutes = require("./src/routes/monster");
const rewardRoutes = require("./src/routes/reward");
const accountRoutes = require("./src/routes/account");
const questRoutes = require("./src/routes/quest");

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

app.use("/monster", monsterRoutes);
app.use("/reward", rewardRoutes);
app.use("/account", accountRoutes);
app.use("/quest", questRoutes);

app.listen(3000, () => {
    console.log(`Example app listening at http://localhost:3000`);
});

module.exports = {app};

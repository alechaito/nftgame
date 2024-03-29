const express = require("express");
const User = require("../controllers/user");

const router = express.Router();

// GETS
router.get("/manage", User.accountView);

//router.post("/user", User.getOrCreteByWallet);
router.post("/sign", User.sign);

router.post("/buyelixir", User.buyElixir);
router.post("/deposit", User.deposit);
router.post("/withdraw", User.withdraw);

module.exports = router;

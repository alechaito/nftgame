const express = require("express");
const Monster = require("../controllers/monster");

const router = express.Router();

// GETS
router.get("/all", Monster.viewAll);

//router.post("/feed", Monster.feed);
//router.post("/update", Monster.update);
//router.post("/mint", Monster.mintEgg);
router.post("/my", Monster.mymonsters);

module.exports = router;

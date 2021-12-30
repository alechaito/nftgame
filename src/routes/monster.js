const express = require("express");
const Monster = require("../controllers/monster");

const router = express.Router();

// GETS
router.get("/view/all", Monster.viewAll);

router.post("/feed", Monster.feed);
router.post("/update", Monster.update);
router.post("/mint", Monster.mintEgg);

module.exports = router;

const express = require("express");
const Quest = require("../controllers/quest");

const router = express.Router();

// GETS
router.post("/start", Quest.start);

module.exports = router;

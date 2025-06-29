const controller = require('../../controller/userController');

// connection

const express = require("express");
const router = express.Router();
router.post("/sign-up", controller.signUp);

module.exports = router;
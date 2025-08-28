const express = require('express');
const controller = require('../../controller/otpController');


const router = express.Router();

router.post('/create', controller.create);
router.post('/verify', controller.checkOtp);

module.exports = router;

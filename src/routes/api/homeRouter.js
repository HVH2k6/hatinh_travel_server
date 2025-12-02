const express = require('express');
const controller = require('../../controller/home');
const { verifyToken } = require('../../service/jwt');

const router = express.Router();

router.get('/', controller.home);



module.exports = router;

const express = require('express');
const controller = require('../../controller/userController');
const { verifyToken } = require('../../service/jwt');

const router = express.Router();


router.post('/sign-up', controller.signUp);


router.post('/sign-in', controller.signIn);


router.get('/me', verifyToken, controller.getMe);
router.post('/renew-access-token', controller.renewAccessToken);
module.exports = router;

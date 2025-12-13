const express = require('express');
const controller = require('../../controller/userController');
const { verifyToken } = require('../../service/jwt');
const { verifyMiddleware } = require('../../controller/otpController');

const router = express.Router();

router.post('/sign-up', verifyMiddleware, controller.signUp);

router.post('/sign-in', controller.signIn);

router.post('/forgot-password', controller.forgotPassword);

router.post('/reset-password', controller.resetPassword);
router.get('/me', verifyToken, controller.getMe);
router.post('/logout', controller.logout);
router.post('/renew-access-token', controller.renewAccessToken);
router.get('/users', controller.getUsers);
module.exports = router;

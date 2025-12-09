const express = require('express');
const controller = require('../../controller/ChatbotController');


const router = express.Router();

router.post('/chat', controller.handleChat);

module.exports = router;

const express = require('express');
const controller = require('../../controller/searchController');

const router = express.Router();

router.get('/', controller.search);

module.exports = router;

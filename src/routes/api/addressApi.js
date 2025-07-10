const express = require('express');
const controller = require('../../controller/addressController');
const { verifyToken } = require('../../service/jwt');

const router = express.Router();

router.get('/province', controller.getProvinces);

router.get('/wards', controller.getWards);
router.get('/districts', controller.getDistricts);

module.exports = router;

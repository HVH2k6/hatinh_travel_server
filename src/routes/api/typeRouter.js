const express = require('express');
const controller = require('../../controller/typeController');
const { verifyToken } = require('../../service/jwt');

const router = express.Router();
router.get('/', controller.getAllTypes);
router.post('/create', controller.createType);

router.get('/update/:id', controller.getType);

router.patch('/update/:id', controller.updateType);

router.delete('/delete/:id', controller.deleteType);

module.exports = router;

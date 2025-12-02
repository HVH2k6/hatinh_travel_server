const express = require('express');
const router = express.Router();
const controller = require('../../controller/reviewController');

const { verifyToken, attachRole } = require('../../middleware/authMiddleware');

router.get('/', controller.getAll);

router.get('/:id', controller.getDetailById);

router.post('/', verifyToken, controller.create);

router.put('/:id', verifyToken, attachRole, controller.update);

router.delete('/:id', verifyToken, attachRole, controller.remove);

module.exports = router;

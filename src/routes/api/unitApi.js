const express = require('express');
const router = express.Router();
const unitController = require('../../controller/UnitController');

// Định nghĩa các route
router.post('/create', unitController.createUnit);
router.get('/', unitController.getAllUnits);
router.get('/:id', unitController.getUnitById);
router.put('/:id', unitController.updateUnit);
router.delete('/:id', unitController.deleteUnit);

module.exports = router;
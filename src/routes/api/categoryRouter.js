const express = require('express');
const controller = require('../../controller/categoryController');
const { verifyToken } = require('../../service/jwt');

const router = express.Router();
router.get('/', controller.getAllCategories);
router.post('/create', controller.create);

router.get('/update/:id', controller.getCategory);

router.patch('/update/:id', controller.updateCategory);

router.delete('/delete/:id', controller.deleteCategory);

module.exports = router;

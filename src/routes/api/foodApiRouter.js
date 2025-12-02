const express = require('express');
const controller = require('../../controller/foodController');
const { verifyToken } = require('../../service/jwt');

const router = express.Router();

router.post('/create', controller.create);
router.get('/:id', controller.getById);
router.get('/food-detail/:slug', controller.getBySlug);

router.get('/', controller.getAll);
router.delete('/delete/:id', controller.deleteFood);
router.patch('/update/:id', controller.update);


module.exports = router;

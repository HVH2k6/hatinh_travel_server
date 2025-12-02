const express = require('express');
const controller = require('../../controller/artController');
const { verifyToken } = require('../../service/jwt');

const router = express.Router();
router.get('/', controller.getAll);
router.post('/create', controller.create);

router.get('/detail/:slug', controller.getDetailBySlug);
router.get('/update-detail/:id', controller.getDetailById);
router.patch('/update/:id', controller.update);
router.delete('/delete/:id', controller.deleteById);

module.exports = router;

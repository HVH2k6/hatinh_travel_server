const express = require('express');
const controller = require('../../controller/productController');


const router = express.Router();

router.post('/create', controller.create);
// router.get('/', controller.getAll);
router.get('/products/:id', controller.getAllByShopId);
router.get('/detail/:id', controller.detail);
router.patch('/update/:id', controller.update);
router.delete('/delete/:id', controller.deleteProduct);



module.exports = router;

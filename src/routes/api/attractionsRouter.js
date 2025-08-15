const express = require('express');
const controller = require('../../controller/attractionsController');

const router = express.Router();
router.get('/', controller.getAll);
router.post(
  '/create',

  controller.createAttraction
);
router.get('/update-detail/:id', controller.getDetailAttraction);
router.patch(
  '/update/:id',

  controller.update
);
router.delete('/delete/:id', controller.deleteAttraction);
module.exports = router;

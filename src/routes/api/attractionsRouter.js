const express = require('express');
const controller = require('../../controller/attractionsController');

const router = express.Router();

router.post(
  '/create',

  controller.createAttraction
);
router.get('/detail/:id', controller.getDetailAttraction);
router.patch(
  '/update/:id',

  controller.update
);
module.exports = router;

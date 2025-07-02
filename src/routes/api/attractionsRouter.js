const express = require('express');
const controller = require('../../controller/attractionsController');
const uploadCloud = require('../../middleware/cloudinaryMiddleware');
const multer = require('multer');
const fileUpload = multer();
const router = express.Router();

router.post(
  '/create',
  fileUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'list_image', maxCount: 10 },
  ]),
  uploadCloud.cloud,
  controller.createAttraction
);
router.get('/detail/:id', controller.getDetailAttraction);
router.patch(
  '/update/:id',
  fileUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'list_image', maxCount: 10 },
  ]),
  uploadCloud.cloud,
  controller.update
)
module.exports = router;

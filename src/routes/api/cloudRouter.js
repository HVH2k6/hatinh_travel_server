const express = require('express');
const router = express.Router();
const controller = require('../../middleware/cloudinaryMiddleware');
const multer = require('multer');
const fileUpload = multer();

router.post(
  '/cloudinary',
  fileUpload.single('file'),

  controller.cloud
);
router.post('/drive/upload',fileUpload.single('fileEditor'), controller.drive);
router.delete('/cloudinary/delete', controller.deleteImage);
router.post('/cloudinary/upload-multiple', fileUpload.array('files', 10), controller.cloudMultiple);
module.exports = router;
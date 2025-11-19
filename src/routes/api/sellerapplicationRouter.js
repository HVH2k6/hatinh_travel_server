const express = require('express');
const controller = require('../../controller/sellerApplication');
const { verifyToken } = require('../../service/jwt');
const { checkAdmin } = require('../../middleware/checkAdmin');

const router = express.Router();

router.post('/seller-applications', controller.createSellerApplication);
router.get('/seller-applications', verifyToken, checkAdmin, controller.getSellerApplications);
router.get('/seller-application-detail/:id', controller.getSellerApplication);
router.post(
  '/seller-applications/:id/approve',
  controller.approveSellerApplication
);
router.post(
  '/seller-applications/:id/reject',
  verifyToken,
  checkAdmin,
  controller.rejectSellerApplication
);

// user xem hồ sơ của mình
router.get('/me',verifyToken, controller.getMySellerApplication);

module.exports = router;

const express = require('express');
const controller = require('../../controller/sellerApplication');

const router = express.Router();

router.post('/seller-applications', controller.createSellerApplication);
router.get('/seller-applications', controller.getSellerApplications);
router.get('/seller-applications/:id', controller.getSellerApplication);
router.post(
  '/seller-applications/:id/approve',
  controller.approveSellerApplication
);
router.post(
  '/seller-applications/:id/reject',
  controller.rejectSellerApplication
);

// user xem hồ sơ của mình
router.get('/me/seller-applications', controller.getMySellerApplication);

module.exports = router;

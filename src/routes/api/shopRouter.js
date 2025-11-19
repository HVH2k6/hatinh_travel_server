const express = require('express');
const controller = require('../../controller/shopController'); // <- file controller ở dưới
const { verifyToken } = require('../../service/jwt');
const { checkAdmin } = require('../../middleware/checkAdmin');
const router = express.Router();

// Seller xem tất cả shop của chính mình (có phân trang, lọc theo status)
router.get('/me/shops',verifyToken, controller.getMyShops);

// Seller xem chi tiết 1 shop của chính mình (kèm check sở hữu)
router.get('/me/shops/:id',verifyToken, controller.getMyShopById);

// (tuỳ chọn) Admin/Client xem danh sách shop (có phân trang, lọc)
router.get('/shops', verifyToken, checkAdmin, controller.getShops);
// (tuỳ chọn) Xem chi tiết 1 shop cụ thể (admin hoặc public nếu policy cho phép)
router.get('/shops/:id', controller.getShopById);
router.patch('/update/:id', verifyToken, controller.update);

module.exports = router;

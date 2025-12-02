// middleware/authMiddleware.js
const User = require('../models/UserModel');
const { verifyToken } = require('../service/jwt'); // File chứa hàm verifyToken của bạn

const attachRole = async (req, res, next) => {
  try {
    // 1. req.user đã có từ verifyToken chạy trước đó
    const userId = req.user.id; 

    // 2. Query DB để lấy Role (Giống cách bạn làm trong checkAdmin)
    const userInDb = await User.findById(userId).populate('roleId');
    
    if (!userInDb) {
      return res.status(401).json({ message: 'User không tồn tại' });
    }

    // 3. Gắn tên Role vào request để Controller dùng
    // Giả sử roleId có field 'name' là 'Admin', 'Seller', 'User'
    req.userRole = userInDb.roleId.name; 
    req.userId = userInDb._id; // Gắn luôn ID chuẩn từ DB cho chắc

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi xác thực quyền' });
  }
};

module.exports = { attachRole, verifyToken };
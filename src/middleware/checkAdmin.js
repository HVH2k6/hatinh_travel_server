const jwt = require('jsonwebtoken');
const { getRolesByNames } = require('../config/constant');
const User = require('../models/UserModel');

const getUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  console.log(' verifyToken ~ token:', token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Gắn thông tin user vào request
    next();
  } catch (err) {
    console.error('Verify token error:', err);
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
};
const checkAdmin = async (req, res, next) => {
  const user = req.user;

  const checkInfoUser = await User.findById(user.id).populate('roleId');
  const getRoleId = checkInfoUser.roleId._id;
  
  const roleUser = await getRolesByNames(['Admin']);
  const roleUserId = roleUser.Admin._id;
  

  if (!getRoleId.equals(roleUserId)) {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }
  next();
};

module.exports = { getUser, checkAdmin };

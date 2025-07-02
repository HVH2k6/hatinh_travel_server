const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const { getRolesByNames } = require('../config/constant');
const { accessToken, refreshToken } = require('../service/jwt');
const jwt = require('jsonwebtoken');

const signUp = async (req, res) => {
  try {
    const { username, email, phoneNumber, password } = req.body;
    const hashPassword = bcrypt.hashSync(password, 10);
    const roleUser = await getRolesByNames(['User']);
    const roleUserId = roleUser.User._id;

    await User.create({
      username,
      email,
      phoneNumber,
      password: hashPassword,
      roleId: roleUserId,
    });

    res.status(200).json({ message: 'success' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'error' });
  }
};

// Hàm đăng nhập người dùng
const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Tạo access token và refresh token sử dụng hàm có sẵn
    const access_token = accessToken({ id: user._id });
    const refresh_token = refreshToken({ id: user._id });

    res.status(200).json({
      message: 'Login successful',
      access_token,
      refresh_token,
      user
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Hàm lấy thông tin người dùng hiện tại
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // Không trả mật khẩu
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const renewAccessToken = (req, res) => {
  const { refresh_token } = req.body; 
  console.log(" renewAccessToken ~ refresh_token:", refresh_token)

  if (!refresh_token) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    
    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);

    
    const newAccessToken = accessToken({ id: decoded.id });

    return res.json({ access_token: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: 'Refresh token expired or invalid' });
  }
};

module.exports = {
  signUp,
  signIn,
  getMe,
  renewAccessToken
};

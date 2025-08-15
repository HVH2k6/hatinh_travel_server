const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const { getRolesByNames } = require('../config/constant');
const { accessToken, refreshToken } = require('../service/jwt');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshTokenModel');

const signUp = async (req, res) => {
  try {
    const { email, password, name, username, code } = req.body;
    const roleUser = await getRolesByNames(['User']);
    const roleUserId = roleUser.User._id;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: passwordHash,
      name,
      username,
      code,
      roleId: roleUserId,
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ message: 'User creation failed' });
  }
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    const access_token = accessToken({ id: user._id });
    const now = new Date();
    const expiresAtTime = new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000); // 100 ngày

    let existingRefresh = await RefreshToken.findOne({ userId: user._id });

    if (!existingRefresh || existingRefresh.expiresIn < now) {
      const new_refresh_token = refreshToken({ id: user._id });

      if (existingRefresh) {
        existingRefresh.token = new_refresh_token;
        existingRefresh.expiresIn = expiresAtTime;
        await existingRefresh.save();
      } else {
        existingRefresh = await RefreshToken.create({
          token: new_refresh_token,
          userId: user._id,
          expiresIn: expiresAtTime,
        });
      }

      user.refresh_token = new_refresh_token;
    } else {
      user.refresh_token = existingRefresh.token;
    }

    await user.save();

    res.json({
      access_token,
      refresh_token: user.refresh_token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy thông tin người dùng hiện tại
const getMe = async (req, res) => {
  try {
    const id = req.user?.id;
    console.log(" getMe ~ id:", id)
    const user = await User.findById(id).populate('roleId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Đăng xuất: xóa refresh token
const logout = async (req, res) => {
  try {
    const id = req.body.id;

    // Xóa refresh token trong DB
    await RefreshToken.deleteOne({ userId: id });

    // Xóa luôn refresh_token trong user nếu bạn lưu
    await User.findByIdAndUpdate(id, { refresh_token: null });

    res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Logout failed' });
  }
};
const renewAccessToken = (req, res) => {
  const { refresh_token } = req.body;
  console.log(' renewAccessToken ~ refresh_token:', refresh_token);

  if (!refresh_token) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);

    const newAccessToken = accessToken({ id: decoded.id });

    return res.json({ access_token: newAccessToken });
  } catch (err) {
    return res
      .status(403)
      .json({ message: 'Refresh token expired or invalid' });
  }
};

module.exports = {
  signUp,
  signIn,
  getMe,
  logout,
  renewAccessToken,
};

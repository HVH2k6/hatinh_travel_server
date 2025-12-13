const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const { getRolesByNames } = require('../config/constant');
const { accessToken, refreshToken } = require('../service/jwt');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshTokenModel');
const Otp = require('../models/OtpModel');
const otpEmailTemplate = require('../templates/otpmail');

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
      return res
        .status(401)
        .json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
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
    console.log(' getMe ~ id:', id);
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
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).populate('roleId');
    res.status(200).json({ users });
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const randomOtp = () => Math.floor(100000 + Math.random() * 900000);
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Kiểm tra email có tồn tại trong hệ thống không
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email chưa được đăng ký" });
    }

    // 2. Kiểm tra xem đã có OTP nào còn hạn chưa để tránh spam
    const existingOtp = await Otp.findOne({
      email,
      expiredAt: { $gt: new Date() },
    });

    if (existingOtp) {
      return res
        .status(400)
        .json({ message: "OTP đã được gửi, vui lòng kiểm tra email hoặc thử lại sau." });
    }

    // 3. Tạo OTP mới
    const code = randomOtp();
    await Otp.create({
      email,
      code,
      expiredAt: Date.now() + 5 * 60 * 1000, // Hết hạn sau 5 phút
    });

    // 4. Gửi email OTP
    const { subject, html, text } = otpEmailTemplate({
      brand: "Hà Tĩnh Travel",
      code: String(code),
      minutes: 5,
      intro: "Bạn đang yêu cầu đặt lại mật khẩu.", // Tùy chỉnh nội dung template nếu cần
    });

    await sendMail({ to: email, subject, html, text });

    return res.status(200).json({ message: "OTP đặt lại mật khẩu đã được gửi đến email" });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
         return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    // 1. Xác thực OTP
    // Tìm OTP khớp với email, code và chưa hết hạn
    const otpRecord = await Otp.findOne({
      email,
      code,
      expiredAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    // 2. Tìm User
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // 3. Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // 4. Cập nhật mật khẩu và xóa OTP
    user.password = passwordHash;
    await user.save();

    // Xóa OTP sau khi sử dụng xong để bảo mật
    await Otp.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({ message: "Đặt lại mật khẩu thành công" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
module.exports = {
  signUp,
  signIn,
  getMe,
  logout,
  renewAccessToken,
  getUsers,
  forgotPassword,
  resetPassword
};

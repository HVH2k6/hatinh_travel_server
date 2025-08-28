const sendMail = require("../helper/sendMail");
const Otp = require("../models/OtpModel");

const User = require("../models/UserModel");
const otpEmailTemplate = require("../templates/otpmail");

// random OTP 6 số
const randomOtp = () => Math.floor(100000 + Math.random() * 900000);

const create = async (req, res) => {
  try {
    const { email } = req.body;

    // check nếu user đã tồn tại
    const checkUser = await User.findOne({ email });
    if (checkUser) {
      return res.status(404).json({ message: "User đã đăng ký" });
    }

    // tìm OTP còn hạn
    const existingOtp = await Otp.findOne({
      email,
      expiredAt: { $gt: new Date() },
    });
    if (existingOtp) {
      return res
        .status(400)
        .json({ message: "OTP đã được gửi, vui lòng thử lại sau." });
    }

    const code = randomOtp();
    await Otp.create({
      email,
      code,
      expiredAt: Date.now() + 5 * 60 * 1000, // 5 phút
    });

    // render template OTP email
    const { subject, html, text } = otpEmailTemplate({
      brand: "Visit Hà Tĩnh",
      code: String(code),
      minutes: 5,
      appUrl: "https://your-app.example.com",
      supportEmail: "support@yourdomain.com",
    });

    // gửi email bằng helper
    await sendMail({ to: email, subject, html, text });

    return res.status(200).json({ message: "OTP created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware verify OTP
const verifyMiddleware = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const otp = await Otp.findOne({
      email,
      code,
      expiredAt: { $gt: new Date() },
    });

    if (!otp) {
      return res
        .status(400)
        .json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    // Xóa OTP sau khi dùng
    await Otp.deleteOne({ _id: otp._id });

    req.verifiedEmail = email;
    return next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Endpoint check OTP độc lập
const checkOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    const otp = await Otp.findOne({
      email,
      code,
      expiredAt: { $gt: new Date() },
    });
    if (!otp) {
      return res
        .status(400)
        .json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
    }
    return res.status(200).json({ message: "OTP hợp lệ" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


module.exports = { create, verifyMiddleware, checkOtp };

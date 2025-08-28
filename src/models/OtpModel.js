const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  code: Number,
  email: { type: String, required: true },
  expiredAt: { type: Date, default: () => Date.now() + 5 * 60 * 1000 }, // +5 phút
  createdAt: { type: Date, default: Date.now },
});

// TTL index để Mongo tự xoá OTP sau khi hết hạn (sau 5 phút)
otpSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model('Otp', otpSchema);
module.exports = Otp;

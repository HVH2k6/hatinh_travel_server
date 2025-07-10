const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userAgent: { type: String },
  expiresIn: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);

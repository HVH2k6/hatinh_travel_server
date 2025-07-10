const { refreshToken: generateRefreshToken } = require('./jwt');
const RefreshToken = require('../models/RefreshTokenModel');

/**
 * Tạo hoặc lấy lại refresh token còn hạn cho user
 * @param {String} userId
 * @returns {Promise<{ token: string, expiresAt: Date }>}
 */
const createRefreshToken = async (userId) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000); // 100 ngày

  let record = await RefreshToken.findOne({ userId });

  if (!record || record.expiresAt < now) {
    const token = generateRefreshToken({ id: userId });

    if (record) {
      record.token = token;
      record.expiresAt = expiresAt;
      await record.save();
    } else {
      await RefreshToken.create({
        userId,
        token,
        expiresAt,
      });
    }

    return { token, expiresAt };
  }

  return { token: record.token, expiresAt: record.expiresAt };
};

module.exports = {
  createRefreshToken,
};

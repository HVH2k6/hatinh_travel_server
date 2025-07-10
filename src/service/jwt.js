const jwt = require('jsonwebtoken');

const accessToken = (payload) => {
  const access_token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  });
  return access_token;
};

const refreshToken = (payload) => {
  const refresh_token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });
  return refresh_token;
};

/**
 * Giải mã access token từ header Authorization
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  console.log(" verifyToken ~ token:", token)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Gắn thông tin user vào request
    next();
  } catch (err) {
    console.error('Verify token error:', err);
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
};



module.exports = {
  accessToken,
  refreshToken,
  verifyToken,
  
};

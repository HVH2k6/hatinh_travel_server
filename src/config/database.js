const mongoose = require('mongoose');
require('dotenv').config();

// Lấy link DB từ biến môi trường
const MONGODB_CONNECT = process.env.MONGODB_CONNECT;
console.log("🚀 ~ MONGODB_CONNECT:", MONGODB_CONNECT)

if (!MONGODB_CONNECT) {
  throw new Error('Please define the MONGODB_CONNECT environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // 1. Nếu đã có kết nối cũ đang sống, dùng lại ngay (Rất nhanh)
  if (cached.conn) {
    return cached.conn;
  }

  // 2. Nếu chưa có, tạo kết nối mới
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // QUAN TRỌNG: Tắt buffer để nếu lỗi thì báo ngay, không treo 10s
    };

    cached.promise = mongoose.connect(MONGODB_CONNECT, opts).then((mongoose) => {
      console.log("New MongoDB connection established");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = dbConnect; // Xuất function ra để dùng
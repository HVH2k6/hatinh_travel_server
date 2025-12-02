const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người trả lời (Shop owner/Admin)
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  // 1. Người đánh giá
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  // 2. Đối tượng được đánh giá (Polymorphic)
  targetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    index: true // Index để query nhanh
  },
  targetType: { 
    type: String, 
    required: true,
    enum: ['Product', 'Shop', 'Attraction'] // Chỉ chấp nhận 3 loại này
  },

  // 3. Nội dung đánh giá
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  content: { type: String, required: true },
  images: [{ type: String }], // Mảng URL ảnh

  // 4. Phản hồi (Chỉ dành cho Shop & Product)
  // Lưu ý: Địa điểm du lịch vẫn có trường này trong DB nhưng logic code sẽ chặn không cho ghi
  reply: { 
    type: replySchema, 
    default: null 
  }

}, { timestamps: true });

// Index kép: Để tìm review của 1 user cho 1 sản phẩm cụ thể (tránh spam review trùng)
reviewSchema.index({ userId: 1, targetId: 1 }, { unique: true }); 

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

module.exports = Review;

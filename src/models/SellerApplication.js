// models/SellerApplication.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const SellerApplicationSchema = new Schema({
  userId: { type: ObjectId, ref: 'User', required: true, index: true }, // ✅ đổi userInfo -> userId

  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending', index: true },

  shopDraft: {
    name: { type: String, required: true, trim: true },
    categoryId: { type: ObjectId, ref: 'Category', required: true },
    image: { type: String, trim: true },
    address: {
      provinceId: { type: ObjectId, ref: 'Province', required: true },
      districtId: { type: ObjectId, ref: 'District', required: true },
      wardId: { type: ObjectId, ref: 'Ward', required: true },
      detail: { type: String, default: '', trim: true },
    },
    contact: {
      phone: { type: String, trim: true },
      facebook: { type: String, trim: true },
      zalo: { type: String, trim: true },
    },
    documents: [{ type: String, trim: true }],
  },

  reviewedBy: { type: ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date },
  rejectReason: { type: String, trim: true, maxlength: 500 },

  shopId: { type: ObjectId, ref: 'Shop', default: null },
}, { timestamps: true });


// Chỉ cho phép 1 hồ sơ pending mỗi user
SellerApplicationSchema.index({ userId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

module.exports = mongoose.model('SellerApplication', SellerApplicationSchema);

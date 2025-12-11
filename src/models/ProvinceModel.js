const mongoose = require('mongoose');

const provinceSchema = new mongoose.Schema({
  name: String,
  code: Number,        // Ví dụ: 42
  codename: String,    // Ví dụ: "ha_tinh"
  division_type: String, // Ví dụ: "tỉnh"
  phone_code: Number   // Mới thêm vào theo JSON mẫu (ví dụ: 239)
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// (Tùy chọn) Virtual để khi query Province có thể lấy luôn list Wards
provinceSchema.virtual('wards', {
  ref: 'Ward',
  localField: 'code',
  foreignField: 'province_code'
});

module.exports = mongoose.model('Province', provinceSchema);
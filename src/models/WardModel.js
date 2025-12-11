const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
  code: Number,
  name: String,
  codename: String,
  division_type: String, // Ví dụ: "phường", "xã"
  
  // QUAN TRỌNG: Đổi từ district_code sang province_code
  province_code: { 
    type: Number, 
    ref: 'Province', // Tham chiếu logic (nếu cần populate)
    index: true      // Đánh index để tìm kiếm xã theo tỉnh nhanh hơn
  }
});

module.exports = mongoose.model('Ward', wardSchema);
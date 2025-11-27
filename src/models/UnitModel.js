const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  // Tên hiển thị đầy đủ (VD: Kilogam, Hộp, Chai)
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  
  // Ký hiệu hiển thị cạnh giá tiền (VD: kg, ml, hộp, cái)
  symbol: { 
    type: String, 
    required: true,
    trim: true 
  },
  
  // Phân loại để dễ filter trong Admin (VD: Admin muốn tìm nhóm đo khối lượng)
  type: { 
    type: String, 
    enum: ['weight', 'volume', 'count', 'length', 'area', 'other'],
    default: 'other' 
  },

  // Sắp xếp thứ tự ưu tiên hiển thị trong Dropdown
  order: { type: Number, default: 0 },

  // Trạng thái (để ẩn đi thay vì xóa vĩnh viễn)
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

const Unit = mongoose.model('Unit', unitSchema);
module.exports = Unit;
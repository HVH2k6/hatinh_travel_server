const mongoose = require('mongoose');
const STATUS = ['ACTIVE', 'PENDING', 'DELETED'];
const { Schema, Types } = mongoose;

const ShopSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  image: { type: String },
  address: {
    provinceId: { type: Types.ObjectId, ref: 'Province', required: true },
    districtId: { type: Types.ObjectId, ref: 'District', required: true },
    wardId: { type: Types.ObjectId, ref: 'Ward', required: true },
    detail: { type: String, default: '', trim: true },
  },
  contact: {
    facebook: { type: String },
    zalo: { type: String },
    phone: { type: String },
  },
  status: {
    type: String,
    enum: STATUS,
    default: 'ACTIVE',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Shop = mongoose.model('Shop', ShopSchema);
module.exports = Shop;

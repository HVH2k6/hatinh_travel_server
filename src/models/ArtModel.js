// models/AttractionsModel.js (hoặc đường dẫn bạn đang dùng)
const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const { Schema, Types } = mongoose;

const artSchema = new Schema({
  name: { type: String, required: true, trim: true },
  image: { type: String, required: true, trim: true },
  list_image: { type: [String], default: [] },

  categoryId: { type: Types.ObjectId, ref: 'Category', default: null },

  address: {
    provinceId: { type: Types.ObjectId, ref: 'Province', required: true },
    
    wardId: { type: Types.ObjectId, ref: 'Ward', required: true },
    detail: { type: String, default: '', trim: true },
  },

  video_url: { type: String, default: '' },
  slug: { type: String, slug: 'name', unique: true, slugPaddingSize: 3 },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const Art = mongoose.model('Art', artSchema);
module.exports = Art;

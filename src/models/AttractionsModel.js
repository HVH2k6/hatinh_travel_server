const { MinKey } = require('mongodb');
const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');
const attractionsSchema = new mongoose.Schema({
  name: String,
  image: String,
  list_image: {
    type: Array,
    default: [],
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Type',
    default: null,
  },
  address: {
    provinceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Province',
      required: true,
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      required: true,
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true,
    },
    detail: {
      type: String, // Số nhà, đường, mô tả chi tiết
      default: '',
    },
  },
  status: String,
  isFree: { type: Boolean, default: false },
  // isHot: { type: Boolean, default: false },
  minPrice: { type: Number, default: 0 },
  maxPrice: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // mapUrl: String,

  slug: { type: String, slug: 'name', unique: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Attractions = mongoose.model('Attractions', attractionsSchema);
module.exports = Attractions;

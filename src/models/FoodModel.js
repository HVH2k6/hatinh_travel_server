const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const foodSchema = new mongoose.Schema({
  name: String,
  image: String,
  list_image: { type: [String], default: [] },
  description: String,
  ingredients: String,
  price: Number,

  address: {
    provinceId: {
      type: mongoose.Types.ObjectId,
      ref: 'Province',
      required: true,
    },
    districtId: { type: mongoose.Types.ObjectId, ref: 'District', required: true },
    wardId: { type: mongoose.Types.ObjectId, ref: 'Ward', required: true },
    detail: { type: String, default: '', trim: true },
  },
  slug: { type: String, slug: 'name', unique: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Food', foodSchema);

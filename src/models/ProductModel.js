const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);
const productSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, slug: 'name', unique: true },
  price: Number,
  description: String,
  image: String,
  list_image: { type: [String], default: [] },

  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;

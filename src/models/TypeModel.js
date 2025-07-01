const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const typeSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, slug: 'name', unique: true },

  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Type = mongoose.model('Type', typeSchema);
module.exports = Type;

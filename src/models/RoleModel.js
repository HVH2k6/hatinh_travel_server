const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;

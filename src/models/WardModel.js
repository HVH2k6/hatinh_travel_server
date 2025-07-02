const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
  code: Number,
  name: String,
  codename: String,
  division_type: String,
  district_code: Number
});

module.exports = mongoose.model('Ward', wardSchema);

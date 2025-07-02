const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  code: Number,
  name: String,
  codename: String,
  division_type: String,
  province_code: Number
});

module.exports = mongoose.model('District', districtSchema);

const mongoose = require('mongoose');

const provinceSchema = new mongoose.Schema({
    name: String,
  code: Number,
  codename: String,
  division_type: String,
  
});

module.exports = mongoose.model('Province', provinceSchema);

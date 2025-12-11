// const District = require('../models/DistrictModel'); // XÓA
const Ward = require('../models/WardModel');
const Province = require('../models/ProvinceModel');

// 1. Lấy danh sách Tỉnh
const getProvinces = async(req, res) => {
  try {
    const provinces = await Province.find().sort({ code: 1 });
    res.json(provinces);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách tỉnh' });
  }
}

// 2. Hàm getDistricts -> XÓA (Vì đã bỏ cấp huyện)

// 3. Lấy danh sách Xã (Sửa logic: tìm theo Tỉnh)
const getWards = async (req, res) => {
  try {
    // Frontend giờ sẽ gửi lên province_code thay vì district_id
    const { province_code } = req.query; 

    if (!province_code) {
      return res.status(400).json({ message: 'Thiếu mã tỉnh (province_code)' });
    }

    // Tìm trực tiếp trong bảng Ward dựa vào province_code
    const wards = await Ward.find({ 
      province_code: Number(province_code) 
    }).sort({ name: 1 });

    res.json(wards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi lấy danh sách xã' });
  }
};

module.exports = { getWards, getProvinces };
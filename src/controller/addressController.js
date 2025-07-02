const District = require('../models/DistrictModel');
const Ward = require('../models/WardModel');
const getDistricts = async (req, res) => {
  try {
    const { province_code } = req.query;
    const districts = await District.find({
      province_code: Number(province_code),
    }).sort({ name: 1 });
    res.json(districts);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách huyện' });
  }
};
const getWards = async (req, res) => {
  try {
    const { district_id } = req.query;
    const district = await District.findById(district_id);
    if (!district)
      return res.status(404).json({ message: 'Không tìm thấy huyện' });

    const wards = await Ward.find({ district_code: district.code }).sort({
      name: 1,
    });
    res.json(wards);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách xã' });
  }
};
module.exports = { getDistricts, getWards };

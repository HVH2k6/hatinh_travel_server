const axios = require('axios');
const mongoose = require('mongoose');

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_CONNECT, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schema Ward (Xã/Phường)
const wardSchema = new mongoose.Schema({
  code: Number,
  name: String,
  codename: String,
  division_type: String,
  province_code: Number
});
const Ward = mongoose.model('Ward', wardSchema);

// Schema Province (Tỉnh)
const provinceSchema = new mongoose.Schema({
  name: String,
  code: Number,
  codename: String,
  division_type: String,
  phone_code: Number
});
const Province = mongoose.model('Province', provinceSchema);

async function cloneHaTinhFlatten() {
  try {
    console.log('⏳ Đang xử lý dữ liệu...');
    
    // Giả sử URL này trả về đúng cấu trúc JSON bạn đã paste
    // (Lưu ý: Nếu API thực tế trả về khác JSON bạn paste thì cần điều chỉnh lại)
    const res = await axios.get('https://provinces.open-api.vn/api/v2/p/42?depth=2');
    const provinceData = res.data;

    // --- LOGIC CŨ BỊ SAI: const districts = provinceData.districts; ---
    
    // --- LOGIC MỚI: Lấy wards trực tiếp từ object Province ---
    // Kiểm tra cấu trúc dữ liệu trước khi xử lý
    const wardsList = provinceData.wards || []; 

    // 1. Xoá dữ liệu cũ
    await Province.deleteMany({ code: 42 });
    await Ward.deleteMany({ province_code: 42 });

    // 2. Lưu Province
    await Province.create({
      name: provinceData.name,
      code: provinceData.code,
      codename: provinceData.codename,
      division_type: provinceData.division_type,
      phone_code: provinceData.phone_code
    });

    // 3. Lưu Wards (Không cần lặp qua districts nữa)
    if (wardsList.length > 0) {
      const wardDocs = wardsList.map(w => ({
        code: w.code,
        name: w.name,
        codename: w.codename,
        division_type: w.division_type,
        // Gán province_code (lấy từ w.province_code có sẵn hoặc lấy từ provinceData)
        province_code: w.province_code || provinceData.code 
      }));

      await Ward.insertMany(wardDocs);
    }

    console.log(`✅ Thành công! Đã lưu Tỉnh ${provinceData.name} và ${wardsList.length} Xã/Phường.`);
    mongoose.disconnect();

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    mongoose.disconnect();
  }
}

cloneHaTinhFlatten();
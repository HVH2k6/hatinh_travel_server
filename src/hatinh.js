const axios = require('axios');
const mongoose = require('mongoose');

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_CONNECT, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schema huyện
const districtSchema = new mongoose.Schema({
    code: Number,
    name: String,
    codename: String,
    division_type: String,
    province_code: Number
  });
  const District = mongoose.model('District', districtSchema);
  
  // Schema xã
  const wardSchema = new mongoose.Schema({
    code: Number,
    name: String,
    codename: String,
    division_type: String,
    district_code: Number
  });
  const Ward = mongoose.model('Ward', wardSchema);
  
  // Clone & lưu 
  async function cloneHaTinhToSeparateCollections() {
    try {
      const res = await axios.get('https://provinces.open-api.vn/api/p/42?depth=3');
      const { districts } = res.data;
  
      // Xoá dữ liệu cũ nếu có
      await District.deleteMany({ province_code: 42 });
      await Ward.deleteMany({});
  
      for (const d of districts) {
        const { code, name, codename, division_type, wards } = d;
  
        // Lưu huyện
        await District.create({
          code,
          name,
          codename,
          division_type,
          province_code: 42
        });
  
        // Lưu các xã tương ứng
        const wardDocs = wards.map(w => ({
          code: w.code,
          name: w.name,
          codename: w.codename,
          division_type: w.division_type,
          district_code: code
        }));
        await Ward.insertMany(wardDocs);
      }
  
      console.log('✅ Đã lưu xong toàn bộ huyện & xã của Hà Tĩnh');
      mongoose.disconnect();
    } catch (err) {
      console.error('❌ Lỗi:', err.message);
      mongoose.disconnect();
    }
  }
  
  cloneHaTinhToSeparateCollections();
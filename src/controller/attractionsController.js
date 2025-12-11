// controllers/attractionsController.js
const Attractions = require('../models/AttractionsModel');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

// --- CẤU HÌNH TỐI ƯU ---

// 1. Bỏ districtId khỏi danh sách Populate
const POPULATE = [
  { path: 'categoryId', select: 'name slug' },
  { path: 'typeId', select: 'name slug' },
  { path: 'address.provinceId', select: 'name codename phone_code' }, // Lấy thêm phone_code nếu cần
  // Đã bỏ districtId
  { path: 'address.wardId', select: 'name codename' },
  { path: 'createdBy', select: 'username name' },
];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const toObjectId = (id) => (isValidId(id) ? new mongoose.Types.ObjectId(id) : null);

const normalizeStatus = (v) => {
  const s = String(v || 'ACTIVE').toUpperCase().trim();
  return ['ACTIVE', 'PENDING', 'DELETED'].includes(s) ? s : 'ACTIVE';
};

const normalizeListImages = (list) => {
  if (!list) return [];
  if (Array.isArray(list)) return [...new Set(list.filter(Boolean))];
  if (typeof list === 'string') {
    try {
      const arr = JSON.parse(list);
      return Array.isArray(arr) ? [...new Set(arr.filter(Boolean))] : [];
    } catch {
      return [];
    }
  }
  return [];
};

// 2. Build Address: Bỏ trường districtId
const buildAddress = (a) => ({
  provinceId: toObjectId(a?.provinceId),
  wardId: toObjectId(a?.wardId),
  detail: (a?.detail || '').trim(),
});

// Helper Cloudinary
const getPublicIdFromUrl = (url) => {
  if (typeof url !== 'string') return null;
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(jpg|jpeg|png|webp|gif|svg)/i);
  return m?.[1] || null;
};

// Helper Time
const parseHHmmToDate = (s) => {
  if (typeof s !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  const d = new Date();
  d.setHours(h, min, 0, 0);
  return d;
};

const normalizeTime = (v) => {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  }
  if (typeof v === 'string') {
    const hhmm = parseHHmmToDate(v);
    if (hhmm) return hhmm;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
};

/* -------------------- CREATE -------------------- */
const createAttraction = async (req, res) => {
  try {
    const b = req.body;

    // Time Validation
    const openTime = normalizeTime(b.openTime);
    const closeTime = normalizeTime(b.closeTime);

    if (openTime !== undefined && openTime !== null && !(openTime instanceof Date)) {
      return res.status(400).json({ message: 'openTime không hợp lệ' });
    }
    if (closeTime !== undefined && closeTime !== null && !(closeTime instanceof Date)) {
      return res.status(400).json({ message: 'closeTime không hợp lệ' });
    }

    const doc = await Attractions.create({
      name: b.name,
      image: b.image,
      list_image: normalizeListImages(b.list_image),
      categoryId: toObjectId(b.categoryId),
      typeId: toObjectId(b.typeId),
      address: buildAddress(b.address), // Đã bỏ districtId
      description: b.description || '',
      status: normalizeStatus(b.status),
      minPrice: Number(b.minPrice || 0),
      maxPrice: Number(b.maxPrice || 0),
      isFree: !!b.isFree,
      createdBy: toObjectId(b.createdBy),
      ...(openTime instanceof Date ? { openTime } : {}),
      ...(closeTime instanceof Date ? { closeTime } : {}),
    });

    // Populate sau khi create để trả về data đầy đủ
    const populated = await doc.populate(POPULATE);
    
    return res.status(201).json({
      message: 'Attraction created successfully',
      attraction: populated,
    });
  } catch (error) {
    console.error('❌ Lỗi tạo địa điểm:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/* -------------------- DETAIL (Optimized .lean()) -------------------- */
const getDetailAttraction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid id' });

    // Dùng .lean() để tăng tốc độ query (không cần hydrate Mongoose document)
    const attraction = await Attractions.findById(id).populate(POPULATE).lean();
    
    if (!attraction) return res.status(404).json({ message: 'Attraction not found' });
    return res.status(200).json(attraction);
  } catch (error) {
    console.error('❌ Lỗi detail by id:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const detail = async (req, res) => {
  try {
    const { slug } = req.params;
    // Dùng .lean()
    const attraction = await Attractions.findOne({ slug }).populate(POPULATE).lean();
    
    if (!attraction) return res.status(404).json({ message: 'Attraction not found' });
    return res.status(200).json(attraction);
  } catch (error) {
    console.error('❌ Lỗi detail by slug:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/* -------------------- UPDATE -------------------- */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid id' });

    const b = req.body;
    const payload = {};
    const $unset = {};

    if (b.name !== undefined) payload.name = b.name;
    if (b.image !== undefined) payload.image = b.image;
    if (b.list_image !== undefined) payload.list_image = normalizeListImages(b.list_image);
    if (b.categoryId !== undefined) payload.categoryId = toObjectId(b.categoryId);
    if (b.typeId !== undefined) payload.typeId = toObjectId(b.typeId);
    
    // Cập nhật address (đã bỏ district)
    if (b.address !== undefined) payload.address = buildAddress(b.address);
    
    if (b.description !== undefined) payload.description = b.description;
    if (b.status !== undefined) payload.status = normalizeStatus(b.status);
    if (b.minPrice !== undefined) payload.minPrice = Number(b.minPrice);
    if (b.maxPrice !== undefined) payload.maxPrice = Number(b.maxPrice);
    if (b.isFree !== undefined) payload.isFree = !!b.isFree;

    // --- Time Handling ---
    if (b.openTime !== undefined) {
      const v = normalizeTime(b.openTime);
      v === null ? ($unset.openTime = '') : (v instanceof Date ? (payload.openTime = v) : null);
      if (v !== null && !(v instanceof Date)) return res.status(400).json({ message: 'openTime lỗi' });
    }
    if (b.closeTime !== undefined) {
      const v = normalizeTime(b.closeTime);
      v === null ? ($unset.closeTime = '') : (v instanceof Date ? (payload.closeTime = v) : null);
      if (v !== null && !(v instanceof Date)) return res.status(400).json({ message: 'closeTime lỗi' });
    }

    const updateDoc = Object.keys($unset).length ? { $set: payload, $unset } : { $set: payload };

    const updated = await Attractions.findByIdAndUpdate(
      id,
      updateDoc,
      { new: true, runValidators: true }
    ).populate(POPULATE);

    if (!updated) return res.status(404).json({ message: 'Attraction not found' });
    return res.status(200).json({ message: 'Attraction updated successfully', attraction: updated });
  } catch (error) {
    console.error('❌ Lỗi update:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/* -------------------- LIST (Optimized) -------------------- */
const { paginate } = require('../helper/pagination');
const WardModel = require('../models/WardModel');

const getAll = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    
    // Tạo filter
    const statusQ = (req.query.status || 'ACTIVE').toString().toUpperCase();
    const where = statusQ === 'ALL' ? {} : { status: normalizeStatus(statusQ) };

    // Tối ưu tìm kiếm: Regex thường chậm với data lớn. 
    // Nếu có thể, hãy đánh Index Text trong MongoDB và dùng $text { $search: ... }
    if (req.query.q) {
      where.name = { $regex: String(req.query.q), $options: 'i' };
    }
    
    // Nếu có query theo Tỉnh (Thay thế cho huyện)
    if (req.query.provinceId && isValidId(req.query.provinceId)) {
        where['address.provinceId'] = toObjectId(req.query.provinceId);
    }

    const result = await paginate({
      model: Attractions,
      page,
      limit,
      where,
      populate: POPULATE,
      sort: { createdAt: -1 },
      lean: true, // Quan trọng để tối ưu tốc độ đọc
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Lỗi phân trang Attraction:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/* -------------------- DELETE (Optimized Parallel) -------------------- */
const deleteAttraction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid id' });

    const attraction = await Attractions.findById(id).lean(); // Dùng lean để lấy data nhanh
    if (!attraction) return res.status(404).json({ message: 'Attraction not found' });

    // --- Tối ưu xoá ảnh: Xử lý song song (Parallel) thay vì tuần tự ---
    const imageList = normalizeListImages(attraction.list_image);
    const mainImage = attraction.image;
    
    // Gom tất cả publicId cần xoá vào 1 mảng
    const publicIdsToDelete = [];

    // 1. Lấy ID từ list_image
    imageList.forEach(url => {
        const pid = getPublicIdFromUrl(url);
        if (pid) publicIdsToDelete.push(pid);
    });

    // 2. Lấy ID từ image chính
    const mainPid = getPublicIdFromUrl(mainImage);
    if (mainPid) publicIdsToDelete.push(mainPid);

    // 3. Thực thi xoá song song (Promise.all)
    if (publicIdsToDelete.length > 0) {
        await Promise.all(
            publicIdsToDelete.map(pid => 
                cloudinary.uploader.destroy(pid, { invalidate: true }).catch(err => 
                    console.error(`⚠️ Lỗi xoá ảnh ${pid}:`, err.message)
                )
            )
        );
    }

    // Xoá Document trong DB
    await Attractions.findByIdAndDelete(id);
    
    return res.status(200).json({ message: 'Attraction deleted successfully' });
  } catch (error) {
    console.error('❌ Lỗi xoá Attraction:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const test = async (_req, res) => res.status(200).json({ message: 'test' });
// Dùng cho menu: /dac-san/:ward_codename
const getByWardCodename = async (req, res) => {
  try {
    const { codename } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    // 1. Tìm ID của xã dựa trên codename (ví dụ: 'xa-cam-binh')
    const ward = await WardModel.findOne({ codename: codename });

    if (!ward) {
      return res.status(404).json({ message: 'Không tìm thấy địa phương này.' });
    }

    // 2. Query món ăn thuộc xã đó
    const where = { 'address.wardId': ward._id };

    const result = await paginate({
      model: Attractions,
      page,
      limit,
      where,
      populate: POPULATE,
      sort: { createdAt: -1 },
      lean: true,
    });

    // Trả về thêm tên xã để FE hiển thị tiêu đề (VD: Đặc sản Xã Cẩm Bình)
    res.json({
        ...result,
        wardInfo: {
            name: ward.name,
            codename: ward.codename
        }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  createAttraction,
  getDetailAttraction,
  update,
  getAll,
  deleteAttraction,
  detail,
  test,
  getByWardCodename
};
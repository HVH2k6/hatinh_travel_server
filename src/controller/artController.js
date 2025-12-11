const { default: mongoose } = require('mongoose');
const Art = require('../models/ArtModel');
const { paginate } = require('../helper/pagination');

// --- HELPERS ---
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const toObjectId = (id) => (isValidId(id) ? new mongoose.Types.ObjectId(id) : null);

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

// 1. Sửa buildAddress: Bỏ districtId
const buildAddress = (a) => ({
  provinceId: toObjectId(a?.provinceId),
  // districtId: toObjectId(a?.districtId), // Đã bỏ
  wardId: toObjectId(a?.wardId),
  detail: (a?.detail || '').trim(),
});

// 2. Sửa POPULATE: Bỏ districtId
const POPULATE = [
  { path: 'categoryId', select: 'name slug' },
  { path: 'address.provinceId', select: 'name codename' },
  // { path: 'address.districtId', select: 'name codename' }, // Đã bỏ
  { path: 'address.wardId', select: 'name codename' },
];

/* -------------------- CREATE -------------------- */
const create = async (req, res) => {
  try {
    const {
      name,
      description,
      image,
      address,
      list_image,
      video_url,
      categoryId,
    } = req.body;

    const art = await Art.create({
      name,
      description,
      image,
      list_image: normalizeListImages(list_image),
      address: buildAddress(address),
      video_url,
      categoryId: toObjectId(categoryId),
    });

    // Populate ngay sau khi tạo để trả về full data
    const populatedArt = await art.populate(POPULATE);
    
    res.status(201).json(populatedArt);
  } catch (error) {
    console.error('Create Art Error:', error);
    res.status(500).json({ error: error.message });
  }
};

/* -------------------- GET ALL (List) -------------------- */
const getAll = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const where = {};

    // Thêm tìm kiếm theo tên
    if (req.query.q) {
      where.name = { $regex: req.query.q, $options: 'i' };
    }

    // Thêm lọc theo Tỉnh (Thay thế cho Huyện)
    if (req.query.provinceId && isValidId(req.query.provinceId)) {
      where['address.provinceId'] = toObjectId(req.query.provinceId);
    }
    
    // Lọc theo Category
    if (req.query.categoryId && isValidId(req.query.categoryId)) {
        where.categoryId = toObjectId(req.query.categoryId);
    }

    const result = await paginate({
      model: Art,
      page,
      limit,
      where,
      populate: POPULATE,
      sort: { createdAt: -1 },
      lean: true,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------- GET DETAILS -------------------- */
const getDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid ID' });

    // Thêm .lean() để tối ưu tốc độ đọc
    const art = await Art.findById(id).populate(POPULATE).lean();
    
    if (!art) return res.status(404).json({ message: 'Art not found' });
    res.json(art);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDetailBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    // Thêm .lean()
    const art = await Art.findOne({ slug }).populate(POPULATE).lean();

    if (!art) return res.status(404).json({ message: 'Art not found' });
    res.json(art);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------- UPDATE -------------------- */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid ID' });

    const data = req.body;
    const payload = {};

    // Chỉ đưa vào payload những trường có gửi lên
    if (data.name !== undefined) payload.name = data.name;
    if (data.image !== undefined) payload.image = data.image;
    if (data.description !== undefined) payload.description = data.description;
    if (data.video_url !== undefined) payload.video_url = data.video_url;
    
    if (data.list_image !== undefined) {
        payload.list_image = normalizeListImages(data.list_image);
    }
    
    if (data.categoryId !== undefined) {
        payload.categoryId = toObjectId(data.categoryId);
    }

    // Cập nhật address (đã bỏ district)
    if (data.address !== undefined) {
        payload.address = buildAddress(data.address);
    }

    // Sử dụng findByIdAndUpdate thay vì find -> gán -> save (Tránh lỗi null check)
    const updatedArt = await Art.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true } // new: true trả về data mới nhất
    ).populate(POPULATE);

    if (!updatedArt) {
      return res.status(404).json({ message: 'Art not found' });
    }

    res.status(200).json(updatedArt);
  } catch (error) {
    console.error('Update Art Error:', error);
    res.status(500).json({ error: error.message });
  }
};

/* -------------------- DELETE -------------------- */
const deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid ID' });

    const art = await Art.findByIdAndDelete(id);
    
    if (!art) {
      return res.status(404).json({ message: 'Art not found' });
    }

    // Nếu muốn xoá ảnh trên Cloudinary thì thêm logic ở đây (giống AttractionsController)

    res.status(200).json({ message: 'Art deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  create,
  getAll,
  getDetailById,
  getDetailBySlug,
  update,
  deleteById,
};
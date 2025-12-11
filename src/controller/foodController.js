const { paginate } = require('../helper/pagination');
const Food = require('../models/FoodModel');
const { default: mongoose } = require('mongoose');

// --- HELPER ---
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

// 1. Build Address: Bỏ districtId
const buildAddress = (a) => ({
  provinceId: toObjectId(a?.provinceId),
  // districtId: toObjectId(a?.districtId), // Đã bỏ
  wardId: toObjectId(a?.wardId),
  detail: (a?.detail || '').trim(),
});

// 2. Populate: Bỏ districtId
const POPULATE = [
  { path: 'address.provinceId', select: 'name codename' },
  { path: 'address.wardId', select: 'name codename' },
];

/* -------------------- CREATE -------------------- */
const create = async (req, res) => {
  try {
    const { name, description, price, image, list_image, ingredients, address } = req.body;
    
    const food = await Food.create({
      name,
      description,
      price,
      image,
      list_image: normalizeListImages(list_image),
      address: buildAddress(address),
      ingredients,
    });

    // Populate để trả về full data ngay sau khi tạo
    const populatedFood = await food.populate(POPULATE);

    res.status(201).json(populatedFood);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------- DELETE -------------------- */
const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const deletedFood = await Food.findByIdAndDelete(id);

    if (!deletedFood) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn để xóa' });
    }

    res.status(200).json({ message: 'Xóa thành công', id: deletedFood._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------- GET ALL (List) -------------------- */
const getAll = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const where = {};

    // 1. Tìm kiếm theo tên
    if (req.query.q) {
        where.name = { $regex: req.query.q, $options: 'i' };
    }

    // 2. Lọc theo Tỉnh (Thay thế huyện)
    if (req.query.provinceId && isValidId(req.query.provinceId)) {
        where['address.provinceId'] = toObjectId(req.query.provinceId);
    }

    // 3. Lọc giá (Ví dụ: minPrice, maxPrice)
    if (req.query.minPrice || req.query.maxPrice) {
        where.price = {};
        if (req.query.minPrice) where.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) where.price.$lte = Number(req.query.maxPrice);
    }

    const result = await paginate({
      model: Food,
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

/* -------------------- GET DETAIL -------------------- */
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID không hợp lệ' });

    // Thêm .lean()
    const food = await Food.findById(id).populate(POPULATE).lean();
    
    if (!food) return res.status(404).json({ message: 'Không tìm thấy món ăn' });
    res.json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    // Thêm .lean()
    const food = await Food.findOne({ slug }).populate(POPULATE).lean();
    
    if (!food) return res.status(404).json({ message: 'Không tìm thấy món ăn' });
    res.json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------- UPDATE -------------------- */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID không hợp lệ' });

    // Note: Phần check quyền (Auth) bạn nên xử lý ở Middleware hoặc giữ logic cũ nếu cần.
    // Ở đây mình tập trung vào logic update data sạch sẽ.

    const data = req.body;
    const payload = {};

    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.image !== undefined) payload.image = data.image;
    if (data.price !== undefined) payload.price = data.price;
    if (data.ingredients !== undefined) payload.ingredients = data.ingredients;
    
    if (data.list_image !== undefined) {
        payload.list_image = normalizeListImages(data.list_image);
    }

    // Cập nhật Address (Logic mới bỏ district)
    if (data.address !== undefined) {
        payload.address = buildAddress(data.address);
    }

    const updatedFood = await Food.findByIdAndUpdate(
        id,
        { $set: payload },
        { new: true, runValidators: true }
    ).populate(POPULATE);

    if (!updatedFood) {
      return res.status(404).json({ message: 'Món ăn không tồn tại' });
    }

    res.status(200).json({ message: 'Cập nhật thành công', food: updatedFood });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { create, deleteFood, getAll, getById, update, getBySlug };
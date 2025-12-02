const { paginate } = require('../helper/pagination');
const Food = require('../models/FoodModel');
const { default: mongoose } = require('mongoose');
const User = require('../models/UserModel');
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const toObjectId = (id) =>
  isValidId(id) ? new mongoose.Types.ObjectId(id) : null;
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

const buildAddress = (a) => ({
  provinceId: toObjectId(a?.provinceId),
  districtId: toObjectId(a?.districtId),
  wardId: toObjectId(a?.wardId),
  detail: (a?.detail || '').trim(),
});
const create = async (req, res) => {
  try {
    const { name, description, price, image, list_image, ingredients } =
      req.body;
    const food = await Food.create({
      name,
      description,
      price,
      image,
      list_image: normalizeListImages(list_image),
      address: buildAddress(req.body.address),
      ingredients,
    });
    res.status(200).json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🚀 ~ deleteFood ~ id:", id)

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
const POPULATE = [
  { path: 'address.provinceId', select: 'name codename' },
  { path: 'address.districtId', select: 'name codename' },
  { path: 'address.wardId', select: 'name codename' },
];
const getAll = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const where = {};

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
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const food = await Food.findById(id).populate(POPULATE);
    res.json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const food = await Food.findOne({ slug: slug }).populate(POPULATE);
    res.json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const update = async (req, res) => {
  try {
    const { id } = req.params;
    // const userId = req.user?.id || req.query.userId; // Lấy ID người đang thao tác

    // if (!userId) {
    //   return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
    // }

    // 1. Tìm Shop theo ID trước (Chưa quan tâm ai sở hữu)
    const food = await Food.findById(id);

    if (!food) {
      return res.status(404).json({ message: 'Món ăn không tồn tại' });
    }

    // // 2. CHECK QUYỀN: Là chủ sở hữu HOẶC là Admin
    // const isOwner =
    //   shop.sellerId && shop.sellerId.toString() === userId.toString();

    // // Nếu KHÔNG phải chủ shop, thì mới bắt đầu kiểm tra xem có phải Admin không
    // if (!isOwner) {
    //   const checkInfoUser = await User.findById(userId).populate('roleId');

    //   // Phòng trường hợp user lỗi hoặc không có role
    //   if (!checkInfoUser || !checkInfoUser.roleId) {
    //     return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
    //   }

    //   const getRoleId = checkInfoUser.roleId._id;
    //   const roleUser = await getRolesByNames(['Admin']);
    //   const roleAdminId = roleUser.Admin._id;

    //   // Nếu không phải Admin -> Chặn luôn
    //   if (!getRoleId.equals(roleAdminId)) {
    //     return res
    //       .status(403)
    //       .json({
    //         message: 'Bạn không phải chủ shop và cũng không phải Admin',
    //       });
    //   }
    // }
    // Nếu code chạy xuống được đây thì tức là: Hoặc là Owner, Hoặc là Admin.

    // 3. UPDATE DATA (Logic Patch)
    const data = req.body;

    if (data.name) food.name = data.name;
    if (data.description) food.description = data.description;
    if (data.image) food.image = data.image;
    if (data.price) food.price = data.price;
    if (data.list_image) food.list_image = normalizeListImages(data.list_image);
    if (data.address) food.address = buildAddress(data.address);
    if (data.ingredients) food.ingredients = data.ingredients;

    await food.save();
    res.status(200).json({ message: 'Cap nhat thanh cong', food });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { create, deleteFood, getAll, getById, update, getBySlug };

const Shop = require('../models/ShopModel');
const { paginate } = require('../helper/pagination');
const { getRolesByNames } = require('../config/constant');
const User = require('../models/UserModel');
const mongoose = require('mongoose'); // Cần thêm để validate ID

// --- HELPER ---
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const toObjectId = (id) => (isValidId(id) ? new mongoose.Types.ObjectId(id) : null);

// 1. POPULATE: Bỏ districtId
const POPULATE = [
  { path: 'categoryId', select: 'name slug' },
  { path: 'sellerId', select: 'username email' },
  { path: 'address.provinceId', select: 'name codename' },
  // { path: 'address.districtId', select: 'name codename' }, // Đã bỏ
  { path: 'address.wardId', select: 'name codename' },
];

/**
 * Helper build lại address để đảm bảo sạch data (không dính district cũ)
 */
const buildAddress = (newAddr, oldAddr = {}) => {
  return {
    provinceId: toObjectId(newAddr.provinceId) || oldAddr.provinceId,
    wardId: toObjectId(newAddr.wardId) || oldAddr.wardId,
    detail: (newAddr.detail || oldAddr.detail || '').trim(),
  };
};

/**
 * GET /me/shops
 * Lấy danh sách shop của chính user
 */
const getMyShops = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) return res.status(400).json({ message: 'Thiếu userId' });

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const { status, provinceId } = req.query;

    const where = { sellerId: userId };
    if (status) where.status = status;
    
    // Thêm lọc theo Tỉnh
    if (provinceId && isValidId(provinceId)) {
        where['address.provinceId'] = toObjectId(provinceId);
    }

    const result = await paginate({
      model: Shop,
      page,
      limit,
      where,
      populate: POPULATE,
      sort: { createdAt: -1 },
      lean: true,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách shop của bạn', error: err.message });
  }
};

/**
 * GET /me/shops/:id
 */
const getMyShopById = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) return res.status(400).json({ message: 'Thiếu userId' });

    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID không hợp lệ' });

    const shop = await Shop.findOne({ _id: id, sellerId: userId }) // Bỏ status: 'ACTIVE' để chủ shop vẫn xem được shop đang chờ/bị ẩn
      .populate(POPULATE)
      .lean();

    if (!shop) {
      return res.status(404).json({
        message: 'Không tìm thấy shop của bạn hoặc bạn không có quyền truy cập',
      });
    }

    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết shop', error: err.message });
  }
};

/* ===== PUBLIC / ADMIN ===== */

const getShops = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const { status, sellerId, categoryId, q, provinceId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (sellerId && isValidId(sellerId)) where.sellerId = sellerId;
    if (categoryId && isValidId(categoryId)) where.categoryId = categoryId;

    // Lọc theo Tỉnh (Thay thế huyện)
    if (provinceId && isValidId(provinceId)) {
        where['address.provinceId'] = toObjectId(provinceId);
    }

    if (q) {
      where.name = { $regex: q.trim(), $options: 'i' };
    }

    const result = await paginate({
      model: Shop,
      page,
      limit,
      where,
      populate: POPULATE,
      sort: { createdAt: -1 },
      lean: true,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách shop', error: err.message });
  }
};

const getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'ID không hợp lệ' });

    const shop = await Shop.findById(id).populate(POPULATE).lean();
    if (!shop) return res.status(404).json({ message: 'Không tìm thấy shop' });
    
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết shop', error: err.message });
  }
};

const getShopBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const shop = await Shop.findOne({ slug }).populate(POPULATE).lean();
    if (!shop) return res.status(404).json({ message: 'Không tìm thấy shop' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết shop', error: err.message });
  }
};

/* ===== UPDATE ===== */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.query.userId;

    if (!userId) return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
    if (!isValidId(id)) return res.status(400).json({ message: 'ID Shop không hợp lệ' });

    // 1. Tìm Shop
    const shop = await Shop.findById(id);
    if (!shop) return res.status(404).json({ message: 'Shop không tồn tại' });

    // 2. CHECK QUYỀN
    const isOwner = shop.sellerId && shop.sellerId.toString() === userId.toString();

    if (!isOwner) {
      const checkInfoUser = await User.findById(userId).populate('roleId');
      if (!checkInfoUser || !checkInfoUser.roleId) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
      }
      
      const roleUser = await getRolesByNames(['Admin']);
      // So sánh ObjectId
      if (!checkInfoUser.roleId._id.equals(roleUser.Admin._id)) {
        return res.status(403).json({ message: 'Bạn không có quyền sửa shop này' });
      }
    }

    // 3. UPDATE DATA
    const data = req.body;

    if (data.name) shop.name = data.name;
    if (data.description) shop.description = data.description;
    if (data.image) shop.image = data.image;
    if (data.categoryId && isValidId(data.categoryId)) shop.categoryId = data.categoryId;

    if (data.status && ['ACTIVE', 'PENDING', 'DELETED'].includes(data.status)) {
      shop.status = data.status;
    }

    // Merge Contact
    if (data.contact) {
      shop.contact = { ...shop.contact, ...data.contact };
    }

    // Update Address (Quan trọng: Xử lý bỏ districtId)
    if (data.address) {
      // Gọi hàm buildAddress để tạo object mới chỉ gồm province, ward, detail
      shop.address = buildAddress(data.address, shop.address);
    }

    shop.updatedAt = Date.now();
    await shop.save();

    // Populate để trả về data đẹp
    await shop.populate(POPULATE);

    res.json(shop);
    
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ', error: err.message });
    }
    res.status(500).json({ message: 'Lỗi cập nhật shop', error: err.message });
  }
};

/* ===== DELETE ===== */
const deletedShop = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.query.userId;

    if (!userId) return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
    if (!isValidId(id)) return res.status(400).json({ message: 'ID Shop không hợp lệ' });

    const shop = await Shop.findById(id);
    if (!shop) return res.status(404).json({ message: 'Shop không tồn tại' });

    // Check Quyền
    const isOwner = shop.sellerId && shop.sellerId.toString() === userId.toString();

    if (!isOwner) {
      const checkInfoUser = await User.findById(userId).populate('roleId');
      if (!checkInfoUser || !checkInfoUser.roleId) {
          return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
      }

      const roleUser = await getRolesByNames(['Admin']);
      if (!checkInfoUser.roleId._id.equals(roleUser.Admin._id)) {
        return res.status(403).json({ message: 'Bạn không có quyền xóa shop này' });
      }
    }

    // Thực hiện xoá
    await Shop.deleteOne({ _id: id });
    res.json({ message: 'Xóa shop thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi xóa shop' });
  }
};

module.exports = {
  getMyShops,
  getMyShopById,
  getShops,
  getShopById,
  getShopBySlug,
  update,
  deletedShop
};
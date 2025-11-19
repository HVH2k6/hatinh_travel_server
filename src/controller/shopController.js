const Shop = require('../models/ShopModel');
const { paginate } = require('../helper/pagination');
const { getRolesByNames } = require('../config/constant');
const User = require('../models/UserModel');

const POPULATE = [
  { path: 'categoryId', select: 'name slug' },
  { path: 'sellerId', select: 'username email' },
  { path: 'address.provinceId', select: 'name codename' },
  { path: 'address.districtId', select: 'name codename' },
  { path: 'address.wardId', select: 'name codename' },
];

/**
 * GET /me/shops
 * Lấy danh sách shop của chính user (seller). Hỗ trợ:
 *  - query: page, limit, status
 *  - lấy userId từ req.user._id (nếu có middleware), fallback query.userId
 */
const getMyShops = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    console.log('🚀 ~ update ~ userId:', userId);
    console.log('🚀 ~ update ~ userId:', userId);
    if (!userId) return res.status(400).json({ message: 'Thiếu userId' });

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const { status } = req.query; // ví dụ: ACTIVE | INACTIVE | DELETED (tuỳ enum của Shop)

    const where = { sellerId: userId };
    if (status) where.status = status;

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
    res
      .status(500)
      .json({ message: 'Lỗi lấy danh sách shop của bạn', error: err.message });
  }
};

/**
 * GET /me/shops/:id
 * Lấy chi tiết một shop của chính user (check sở hữu).
 */
const getMyShopById = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) return res.status(400).json({ message: 'Thiếu userId' });

    const { id } = req.params;

    const shop = await Shop.findOne({ _id: id, sellerId: userId,status:'ACTIVE' })
      .populate(POPULATE)
      .lean();

    if (!shop) {
      return res
        .status(404)
        .json({
          message:
            'Không tìm thấy shop của bạn hoặc bạn không có quyền truy cập',
        });
    }

    res.json(shop);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Lỗi lấy chi tiết shop', error: err.message });
  }
};

/* ===== (Tuỳ chọn) Dành cho admin/public nếu cần ===== */

const getShops = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const { status, sellerId, categoryId, q } = req.query;

    const where = {};
    if (status) where.status = status;
    if (sellerId) where.sellerId = sellerId;
    if (categoryId) where.categoryId = categoryId;

    // tìm kiếm đơn giản theo tên
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
    res
      .status(500)
      .json({ message: 'Lỗi lấy danh sách shop', error: err.message });
  }
};

const getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await Shop.findById(id).populate(POPULATE).lean();
    if (!shop) return res.status(404).json({ message: 'Không tìm thấy shop' });
    res.json(shop);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Lỗi lấy chi tiết shop', error: err.message });
  }
};
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.query.userId; // Lấy ID người đang thao tác

    if (!userId) {
      return res.status(401).json({ message: 'Bạn chưa đăng nhập' });
    }

    // 1. Tìm Shop theo ID trước (Chưa quan tâm ai sở hữu)
    const shop = await Shop.findById(id);

    if (!shop) {
      return res.status(404).json({ message: 'Shop không tồn tại' });
    }

    // 2. CHECK QUYỀN: Là chủ sở hữu HOẶC là Admin
    const isOwner = shop.sellerId && shop.sellerId.toString() === userId.toString();

    // Nếu KHÔNG phải chủ shop, thì mới bắt đầu kiểm tra xem có phải Admin không
    if (!isOwner) {
      const checkInfoUser = await User.findById(userId).populate('roleId');
      
      // Phòng trường hợp user lỗi hoặc không có role
      if (!checkInfoUser || !checkInfoUser.roleId) {
          return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
      }

      const getRoleId = checkInfoUser.roleId._id;
      const roleUser = await getRolesByNames(['Admin']);
      const roleAdminId = roleUser.Admin._id;

      // Nếu không phải Admin -> Chặn luôn
      if (!getRoleId.equals(roleAdminId)) {
        return res.status(403).json({ message: 'Bạn không phải chủ shop và cũng không phải Admin' });
      }
    }
    // Nếu code chạy xuống được đây thì tức là: Hoặc là Owner, Hoặc là Admin.

    // 3. UPDATE DATA (Logic Patch)
    const data = req.body;

    if (data.name) shop.name = data.name;
    if (data.description) shop.description = data.description;
    if (data.image) shop.image = data.image;
    if (data.categoryId) shop.categoryId = data.categoryId;

    if (data.status && ['ACTIVE', 'PENDING', 'DELETED'].includes(data.status)) {
      shop.status = data.status;
    }

    // Update Nested Object (Merge data)
    if (data.contact) {
      shop.contact = {
        ...shop.contact,
        ...data.contact 
      };
    }

    if (data.address) {
      shop.address = {
        ...shop.address, 
        ...data.address 
      };
    }

    shop.updatedAt = Date.now();

    await shop.save();

    // 4. Trả về kết quả (Chỉ 1 lần duy nhất)
    res.json(shop);
    
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ', error: err.message });
    }
    res.status(500).json({ message: 'Lỗi cập nhật shop', error: err.message });
  }
};
module.exports = {
  getMyShops,
  getMyShopById,
  // Tuỳ chọn:
  getShops,
  getShopById,
  update,
};

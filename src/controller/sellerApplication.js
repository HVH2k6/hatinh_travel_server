// controllers/SellerApplicationController.js
const SellerApplication = require('../models/SellerApplication');
const Shop = require('../models/ShopModel');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');
const { paginate } = require('../helper/pagination');
const { getRolesByNames } = require('../config/constant');

// Dùng lại ở nhiều nơi
const POPULATE = [
  { path: 'userId', select: 'username email role' },
  { path: 'shopDraft.categoryId', select: 'name slug' },
  { path: 'shopDraft.address.provinceId', select: 'name codename' },
  { path: 'shopDraft.address.districtId', select: 'name codename' },
  { path: 'shopDraft.address.wardId', select: 'name codename' },
];

/**
 * Tạo hồ sơ đăng ký bán hàng (status = pending)
 * Body: { shopDraft: {...}, userId? }
 */
const createSellerApplication = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    if (!userId) return res.status(400).json({ message: 'Thiếu userId' });

    const draft = req.body?.shopDraft || {};
    if (!draft?.name || !draft?.categoryId) {
      return res
        .status(400)
        .json({ message: 'Thiếu thông tin shopDraft.name hoặc shopDraft.categoryId' });
    }

    // Chặn trùng pending
    const existed = await SellerApplication.findOne({ userId, status: 'pending' });
    if (existed) {
      return res.status(409).json({ message: 'Bạn đã gửi hồ sơ, vui lòng chờ duyệt.' });
    }

    const app = await SellerApplication.create({
      userId,
      shopDraft: draft,
      status: 'pending', // <- đảm bảo trạng thái
    });

    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tạo hồ sơ', error: err.message });
  }
};

/**
 * Lấy danh sách hồ sơ (admin)
 * Query: status?=pending|approved|rejected, userId?, page?, limit?
 */
const getSellerApplications = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const { status, userId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const apps = await paginate({
      model: SellerApplication,
      page,
      limit,
      where,
      populate: POPULATE,         // <- đã khai báo
      sort: { createdAt: -1 },
      lean: true,
    });

    res.json(apps); // nên return {items,total,page,limit} từ helper paginate
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách hồ sơ', error: err.message });
  }
};

/**
 * Lấy chi tiết một hồ sơ
 */
const getSellerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await SellerApplication.findById(id)
      .populate(POPULATE)   // dùng POPULATE chung
      .lean();

    if (!app) return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết hồ sơ', error: err.message });
  }
};

/**
 * Duyệt hồ sơ (admin)
 * Tạo Shop từ shopDraft, đổi role user => seller, cập nhật hồ sơ
 */
const approveSellerApplication = async (req, res) => {
  const session = await SellerApplication.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const adminId = req.user?._id || null;

    const app = await SellerApplication.findById(id).session(session);
    if (!app || app.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ pending' });
    }

    // Tạo Shop từ shopDraft
    const shop = await Shop.create(
      [{ ...app.shopDraft, sellerId: app.userId, status: 'ACTIVE' }],
      { session }
    );
    const shopDoc = shop[0];

    // Đổi role user
    // Nếu hệ thống dùng mảng roles:
    // await User.findByIdAndUpdate(app.userId, { $addToSet: { roles: 'seller' } }, { session });
    // Nếu dùng field đơn:
    const sellerRole = await getRolesByNames(['Seller']);
    const idSeller = sellerRole.Seller._id;
    await User.findByIdAndUpdate(app.userId, { $set: { roleId: idSeller } }, { session });

    // Cập nhật hồ sơ
    app.status = 'approved';
    app.shopId = shopDoc._id;
    app.reviewedBy = adminId;
    app.reviewedAt = new Date();
    await app.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Approved', shopId: shopDoc._id });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Lỗi duyệt hồ sơ', error: err.message });
  }
};

/**
 * Từ chối hồ sơ (admin)
 * Body: reason?
 */
const rejectSellerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🚀 ~ rejectSellerApplication ~ id:", id)
    const adminId = req.user?._id || null;

    const app = await SellerApplication.findById(id);
    if (!app || app.status !== 'pending') {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ pending' });
    }

    app.status = 'rejected';
    app.rejectReason = req.body?.reason || '';
    app.reviewedBy = adminId;
    app.reviewedAt = new Date();
    await app.save();

    res.json({ message: 'Rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi từ chối hồ sơ', error: err.message });
  }
};

/**
 * Lấy hồ sơ của chính user (để user xem trạng thái)
 */
const getMySellerApplication = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;
    if (!userId) return res.status(400).json({ message: 'Thiếu userId' });

    const apps = await SellerApplication.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy hồ sơ của bạn', error: err.message });
  }
};

module.exports = {
  createSellerApplication,
  getSellerApplications,
  getSellerApplication,
  approveSellerApplication,
  rejectSellerApplication,
  getMySellerApplication,
};

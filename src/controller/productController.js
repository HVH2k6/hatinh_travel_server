const { paginate } = require('../helper/pagination');
const Product = require('../models/ProductModel');
const mongoose = require('mongoose');

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

// 1. Config Populate
const POPULATE = [
  { path: 'shopId', select: 'name contact address' }, // Lấy thêm address của shop nếu cần hiển thị
  { path: 'unitId', select: 'name symbol' },
];

/* -------------------- CREATE -------------------- */
const create = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      list_image,
      contact,
      shopId,
      unitId,
    } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      image,
      list_image: normalizeListImages(list_image),
      contact,
      shopId: toObjectId(shopId),
      unitId: toObjectId(unitId),
    });

    // Populate để trả về data đầy đủ cho FE hiển thị ngay
    const populatedProduct = await product.populate(POPULATE);
    
    res.status(200).json(populatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------- GET ALL (Public Market) -------------------- */
const getAll = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    
    const where = {};
    
    // Tìm kiếm theo tên sản phẩm
    if (req.query.q) {
      where.name = { $regex: req.query.q, $options: 'i' };
    }

    // Lọc theo Shop
    if (req.query.shopId && isValidId(req.query.shopId)) {
      where.shopId = toObjectId(req.query.shopId);
    }

    // Lọc theo Category (nếu có trường này trong model)
    if (req.query.categoryId && isValidId(req.query.categoryId)) {
      where.categoryId = toObjectId(req.query.categoryId);
    }

    const result = await paginate({
      model: Product,
      page,
      limit,
      where,
      populate: POPULATE,
      sort: { createdAt: -1 },
      lean: true,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------- GET BY SHOP ID -------------------- */
const getAllByShopId = async (req, res) => {
  try {
    const { id } = req.params; // Đây là shopId
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid Shop ID' });

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    
    const where = { shopId: id };

    // Hỗ trợ tìm kiếm trong shop
    if (req.query.q) {
      where.name = { $regex: req.query.q, $options: 'i' };
    }

    const result = await paginate({
      model: Product,
      page,
      limit,
      where,
      populate: POPULATE,
      sort: { createdAt: -1 },
      lean: true,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------- DETAIL -------------------- */
const detail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid Product ID' });

    const product = await Product.findById(id).populate(POPULATE).lean();
    
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const detailBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug }).populate(POPULATE).lean();
    
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------- UPDATE -------------------- */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid Product ID' });

    const data = req.body;
    const payload = {};

    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.price !== undefined) payload.price = data.price;
    if (data.image !== undefined) payload.image = data.image;
    if (data.contact !== undefined) payload.contact = data.contact;
    
    if (data.unitId !== undefined && isValidId(data.unitId)) {
        payload.unitId = toObjectId(data.unitId);
    }

    if (data.list_image !== undefined) {
      payload.list_image = normalizeListImages(data.list_image);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true, runValidators: true }
    ).populate(POPULATE);

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* -------------------- DELETE -------------------- */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid Product ID' });

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  create,
  getAll,
  getAllByShopId,
  detail,
  update,
  deleteProduct,
  detailBySlug
};
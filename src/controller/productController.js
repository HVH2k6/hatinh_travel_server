const { paginate } = require('../helper/pagination');
const Product = require('../models/ProductModel');

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

  try {
    const product = await Product.create({
      name,
      description,
      price,
      image,
      list_image: normalizeListImages(list_image),
      contact,
      shopId,
      unitId,
    });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getAll = async (req, res) => {
  try {
    const products = await Product.find({}).populate('shopId');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
  const POPULATE = [
      { path: 'shopId', select: 'name contact' },
      { path: 'unitId', select: 'name symbol' },
    ];
const getAllByShopId = async (req, res) => {
  try {
    const { id } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const where = { shopId: id };
  

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
const detail = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(POPULATE);
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const detailBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug }).populate(POPULATE);
    if(!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, list_image, contact , unitId} = req.body;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (image) product.image = image;
    if (list_image) product.list_image = normalizeListImages(list_image);
    if (contact) product.contact = contact;
    if (unitId) product.unitId = unitId;
    
    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🚀 ~ deleteProduct ~ id:', id);
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await Product.findByIdAndDelete(id);
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

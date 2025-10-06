const Category = require('../models/CategoryModel');
const { paginate } = require('../helper/pagination');

// === GET ALL CATEGORIES (WITH PAGINATION) ===
const getAllCategories = async (req, res) => {
  try {
    const page = Number(req.query.page || 1); // Default page is 1
    const limit = Number(req.query.limit || 10); // Default limit is 10



    // Optional search by name
    if (req.query.q) {
      where.name = { $regex: String(req.query.q), $options: 'i' }; // Case-insensitive search
    }

    const result = await paginate({
      model: Category,
      page,
      limit,
     
      populate: [], // If you want to populate specific fields, you can define them here
      sort: { createdAt: -1 }, // Sort by createdAt in descending order
      lean: true, // Use lean() for plain JS objects
    });

    return res.status(200).json(result); // Return paginated categories
  } catch (error) {
    console.error('❌ Lỗi phân trang Category:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
const create = async (req, res) => {
  try {
    const { name, parentId, description } = req.body;
    console.log("🚀 ~ create ~ parentId:", parentId)
    const category = await Category.create({ name, parentId, description });
    res.status(200).json({ category });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id).exec();

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    let parentCategory = null;
    if (category.parentId) {
      parentCategory = await Category.findById(category.parentId);
    }

    res.status(200).json({
      category,
      parentCategory: parentCategory || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId, description } = req.body;

    let category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name) category.name = name;
    if (parentId !== undefined) category.parentId = parentId;
    if (description) category.description = description;
    category.updatedAt = Date.now();

    await category.save();

    let parentCategory = null;
    if (category.parentId) {
      parentCategory = await Category.findById(category.parentId);
    }

    res.status(200).json({
      category,
      parentCategory: parentCategory || null,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  create,
  getCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
};

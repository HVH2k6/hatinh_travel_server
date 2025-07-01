const Category = require('../models/CategoryModel');
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).exec();
    res.status(200).json({ categories });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
const create = async (req, res) => {
  try {
    const { name, parentId, description } = req.body;
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

module.exports = { create, getCategory, updateCategory, deleteCategory, getAllCategories };

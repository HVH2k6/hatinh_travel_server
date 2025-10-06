const Type = require('../models/TypeModel');
const { paginate } = require('../helper/pagination');

const getAllTypes = async (req, res) => {
  try{
  const page = Number(req.query.page || 1); // Default page is 1
    const limit = Number(req.query.limit || 10); // Default limit is 10



    // Optional search by name
    if (req.query.q) {
      where.name = { $regex: String(req.query.q), $options: 'i' }; // Case-insensitive search
    }

    const result = await paginate({
      model: Type,
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
const createType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const type = await Type.create({ name, description });
    res.status(200).json(type);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getType = async (req, res) => {
  try {
    const { id } = req.params;
    const type = await Type.findById(id);
    if (!type) {
      return res.status(404).json({ error: 'Type not found' });
    }
    res.status(200).json(type);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const type = await Type.findById(id);
    if (!type) {
      return res.status(404).json({ error: 'Type not found' });
    }
    if (name) type.name = name;
    if (description) type.description = description;
    await type.save();
    res.status(200).json(type);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const deleteType = async (req, res) => {
  try {
    const { id } = req.params;
    const type = await Type.findById(id);
    if (!type) {
      return res.status(404).json({ error: 'Type not found' });
    }
    await Type.findByIdAndDelete(id);
    res.status(200).json({ message: 'Type deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
module.exports = {
  getAllTypes,
  createType,
  getType,
  updateType,
  deleteType
};

const Type = require('../models/TypeModel');

const getAllTypes = async (req, res) => {
  try {
    const types = await Type.find();
    res.status(200).json({ types: types });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

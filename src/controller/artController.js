const { default: mongoose } = require('mongoose');
const Art = require('../models/ArtModel');
const { paginate } = require('../helper/pagination');

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
    const {
      name,
      description,
      image,
      address,
      list_image,
      video_url,
      categoryId,
    } = req.body;
    const art = await Art.create({
      name,
      description,
      image,
      list_image: normalizeListImages(list_image),
      address: buildAddress(address),
      video_url,
      categoryId,
    });
    res.status(200).json(art);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const POPULATE = [
  { path: 'categoryId', select: 'name slug' },
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
      model: Art,
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
const getDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const art = await Art.findById(id).populate(POPULATE);
    res.json(art);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getDetailBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const art = await Art.findOne({ slug }).populate(POPULATE);
    res.json(art);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const art = await Art.findById(id);
    if (data.name !== undefined) art.name = data.name;
    if (data.image !== undefined) art.image = data.image;
    if (data.list_image !== undefined)
      art.list_image = normalizeListImages(data.list_image);
    if (data.address !== undefined) art.address = buildAddress(data.address);
    if (data.video_url !== undefined) art.video_url = data.video_url;
    if (data.categoryId !== undefined)
      art.categoryId = toObjectId(data.categoryId);
    if (!art) {
      return res.status(404).json({ message: 'Art not found' });
    }
    await art.updateOne(art);
    res.status(200).json(art);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    const art = await Art.findById(id);
    if (!art) {
      return res.status(404).json({ message: 'Art not found' });
    }
    await art.deleteOne();
    res.status(200).json({ message: 'Art deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  create,
  getAll,
  getDetailById,
  getDetailBySlug,
  update,
  deleteById,
};

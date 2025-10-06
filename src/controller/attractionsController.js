// controllers/attractionsController.js
const Attractions = require('../models/AttractionsModel');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

const POPULATE = [
  { path: 'categoryId', select: 'name slug' },
  { path: 'typeId', select: 'name slug' },
  { path: 'address.provinceId', select: 'name codename' },
  { path: 'address.districtId', select: 'name codename' },
  { path: 'address.wardId', select: 'name codename' },
  { path: 'createdBy', select: 'username name' },
];

const normalizeStatus = (v) => {
  const s = String(v || 'ACTIVE').toUpperCase().trim();
  return ['ACTIVE', 'PENDING', 'DELETED'].includes(s) ? s : 'ACTIVE';
};

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

const buildAddress = (a) => ({
  provinceId: toObjectId(a?.provinceId),
  districtId: toObjectId(a?.districtId),
  wardId: toObjectId(a?.wardId),
  detail: (a?.detail || '').trim(),
});

// Lấy public_id từ URL Cloudinary
const getPublicIdFromUrl = (url) => {
  if (typeof url !== 'string') return null;
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(jpg|jpeg|png|webp|gif|svg)/i);
  return m?.[1] || null;
};

/* ---------- TIME HELPERS (dùng cho open/close) ---------- */
const parseHHmmToDate = (s) => {
  if (typeof s !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  const d = new Date();
  d.setHours(h, min, 0, 0);
  return d;
};

// Chuẩn hoá thời gian: Date | number | ISO | "HH:mm"
// undefined -> không set; null/'' -> xoá (ở update)
const normalizeTime = (v) => {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v;

  if (typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  }

  if (typeof v === 'string') {
    const hhmm = parseHHmmToDate(v);
    if (hhmm) return hhmm;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  }

  return undefined;
};

/* -------------------- CREATE -------------------- */
const createAttraction = async (req, res) => {
  try {
    const b = req.body;

    const openTime = normalizeTime(b.openTime);
    const closeTime = normalizeTime(b.closeTime);

    if (openTime === undefined && closeTime === undefined) {
      // không set -> để schema lo default
    } else {
      // validate thô: nếu có giá trị mà không phải Date thì lỗi
      if (openTime !== undefined && openTime !== null && !(openTime instanceof Date)) {
        return res.status(400).json({ message: 'openTime không hợp lệ' });
      }
      if (closeTime !== undefined && closeTime !== null && !(closeTime instanceof Date)) {
        return res.status(400).json({ message: 'closeTime không hợp lệ' });
      }
    }

    const doc = await Attractions.create({
      name: b.name,
      image: b.image,
      list_image: normalizeListImages(b.list_image),
      categoryId: toObjectId(b.categoryId),
      typeId: toObjectId(b.typeId),
      address: buildAddress(b.address),
      description: b.description || '',
      status: normalizeStatus(b.status),
      minPrice: Number(b.minPrice || 0),
      maxPrice: Number(b.maxPrice || 0),
      isFree: !!b.isFree,
      createdBy: toObjectId(b.createdBy),
      ...(openTime instanceof Date ? { openTime } : {}),
      ...(closeTime instanceof Date ? { closeTime } : {}),
    });

    const populated = await doc.populate(POPULATE);
    return res.status(201).json({
      message: 'Attraction created successfully',
      attraction: populated,
    });
  } catch (error) {
    console.error('❌ Lỗi tạo địa điểm:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/* -------------------- DETAIL -------------------- */
const getDetailAttraction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid id' });

    const attraction = await Attractions.findById(id).populate(POPULATE).lean();
    if (!attraction) return res.status(404).json({ message: 'Attraction not found' });
    return res.status(200).json(attraction);
  } catch (error) {
    console.error('❌ Lỗi detail by id:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const detail = async (req, res) => {
  try {
    const { slug } = req.params;
    const attraction = await Attractions.findOne({ slug }).populate(POPULATE).lean();
    if (!attraction) return res.status(404).json({ message: 'Attraction not found' });
    return res.status(200).json(attraction);
  } catch (error) {
    console.error('❌ Lỗi detail by slug:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/* -------------------- UPDATE -------------------- */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid id' });

    const b = req.body;
    const payload = {};
    const $unset = {};

    if (b.name !== undefined) payload.name = b.name;
    if (b.image !== undefined) payload.image = b.image;
    if (b.list_image !== undefined) payload.list_image = normalizeListImages(b.list_image);
    if (b.categoryId !== undefined) payload.categoryId = toObjectId(b.categoryId);
    if (b.typeId !== undefined) payload.typeId = toObjectId(b.typeId);
    if (b.address !== undefined) payload.address = buildAddress(b.address);
    if (b.description !== undefined) payload.description = b.description;
    if (b.status !== undefined) payload.status = normalizeStatus(b.status);
    if (b.minPrice !== undefined) payload.minPrice = Number(b.minPrice);
    if (b.maxPrice !== undefined) payload.maxPrice = Number(b.maxPrice);
    if (b.isFree !== undefined) payload.isFree = !!b.isFree;

    // --- openTime ---
    if (b.openTime !== undefined) {
      const v = normalizeTime(b.openTime);
      if (v === null) {
        $unset.openTime = '';
      } else if (v instanceof Date) {
        payload.openTime = v;
      } else {
        return res.status(400).json({ message: 'openTime không hợp lệ' });
      }
    }

    // --- closeTime ---
    if (b.closeTime !== undefined) {
      const v = normalizeTime(b.closeTime);
      if (v === null) {
        $unset.closeTime = '';
      } else if (v instanceof Date) {
        payload.closeTime = v;
      } else {
        return res.status(400).json({ message: 'closeTime không hợp lệ' });
      }
    }

    const updateDoc = Object.keys($unset).length
      ? { $set: payload, $unset }
      : { $set: payload };

    const updated = await Attractions.findByIdAndUpdate(
      id,
      updateDoc,
      { new: true, runValidators: true }
    ).populate(POPULATE);

    if (!updated) return res.status(404).json({ message: 'Attraction not found' });
    return res.status(200).json({ message: 'Attraction updated successfully', attraction: updated });
  } catch (error) {
    console.error('❌ Lỗi update:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/* -------------------- LIST (paginate) -------------------- */
const { paginate } = require('../helper/pagination');
const getAll = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const statusQ = (req.query.status || 'ACTIVE').toString().toUpperCase();
    const where = statusQ === 'ALL' ? {} : { status: normalizeStatus(statusQ) };

    if (req.query.q) {
      where.name = { $regex: String(req.query.q), $options: 'i' };
    }

    const result = await paginate({
      model: Attractions,
      page,
      limit,
      where,
      populate: POPULATE,
      sort: { createdAt: -1 },
      lean: true,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Lỗi phân trang Attraction:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/* -------------------- DELETE -------------------- */
const deleteAttraction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid id' });

    const attraction = await Attractions.findById(id).lean();
    if (!attraction) return res.status(404).json({ message: 'Attraction not found' });

    const list = normalizeListImages(attraction.list_image);
    for (const url of list) {
      const publicId = getPublicIdFromUrl(url);
      if (publicId) {
        try { await cloudinary.uploader.destroy(publicId, { invalidate: true }); } catch {}
      }
    }

    const mainPublicId = getPublicIdFromUrl(attraction.image);
    if (mainPublicId) {
      try { await cloudinary.uploader.destroy(mainPublicId, { invalidate: true }); } catch {}
    }

    await Attractions.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Attraction deleted successfully' });
  } catch (error) {
    console.error('❌ Lỗi xoá Attraction:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const test = async (_req, res) => res.status(200).json({ message: 'test' });

module.exports = {
  createAttraction,
  getDetailAttraction,
  update,
  getAll,
  deleteAttraction,
  detail,
  test,
};

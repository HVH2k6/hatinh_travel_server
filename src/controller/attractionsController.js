const Attractions = require('../models/AttractionsModel');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const mongoose = require('mongoose');
const { paginate } = require('../helper/pagination');

const createAttraction = async (req, res) => {
  try {
    const {
      name,
      categoryId,
      typeId,
      image,
      list_image,
      address,
      description,
      status,
      minPrice,
      maxPrice,
      isFree,
      createdBy,
    } = req.body;

    const newAttraction = await Attractions.create({
      name,
      image,
      list_image,
      categoryId: categoryId ? new mongoose.Types.ObjectId(categoryId) : null,
      typeId: typeId ? new mongoose.Types.ObjectId(typeId) : null,
      address: {
        provinceId: new mongoose.Types.ObjectId(address.provinceId),
        districtId: new mongoose.Types.ObjectId(address.districtId),
        wardId: new mongoose.Types.ObjectId(address.wardId),
        detail: address.detail || '',
      },
      description,
      status,
      minPrice,
      maxPrice,
      isFree,
      createdBy: createdBy ? new mongoose.Types.ObjectId(createdBy) : null, // đảm bảo không undefined
    });

    res.status(200).json({
      message: 'Attraction created successfully',
      attraction: newAttraction,
    });
  } catch (error) {
    console.error('❌ Lỗi tạo địa điểm:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getDetailAttraction = async (req, res) => {
  try {
    const { id } = req.params;

    const attraction = await Attractions.findById(id)
      .populate('categoryId', 'name')
      .populate('typeId', 'name')
      .populate('address.provinceId', 'name')
      .populate('address.districtId', 'name')
      .populate('address.wardId', 'name')
      .populate('createdBy', 'name');

    if (!attraction) {
      return res.status(404).json({ message: 'Attraction not found' });
    }

    return res.status(200).json(attraction);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🚀 ~ update ~ id:', id);
    const {
      name,
      categoryId,
      typeId,
      image,
      list_image,
      address: addressString,
      description,
      status,
      minPrice,
      maxPrice,
      isFree,
    } = req.body;

    const attraction = await Attractions.findById(id).exec();
    console.log('🚀 ~ update ~ attraction:', attraction);

    const address = {
      provinceId: new mongoose.Types.ObjectId(addressString.provinceId),
      districtId: new mongoose.Types.ObjectId(addressString.districtId),
      wardId: new mongoose.Types.ObjectId(addressString.wardId),
      detail: addressString.detail || '',
    };

    await Attractions.updateOne(
      { _id: id },
      {
        $set: {
          name,
          categoryId,
          typeId,
          image,
          list_image,
          address,
          description,
          status,
          minPrice,
          maxPrice,
          isFree,
        },
      }
    );

    res.status(200).json({ message: 'Attraction updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await paginate({
      model: Attractions,
      page,
      limit,
      where: {}, // nếu cần điều kiện lọc thì thêm vào đây
      populate: [
        { path: 'categoryId', select: 'name' },
        { path: 'typeId', select: 'name' },
        { path: 'address.provinceId', select: 'name' },
        { path: 'address.districtId', select: 'name' },
        { path: 'address.wardId', select: 'name' },
        { path: 'createdBy', select: 'username' }, // hoặc 'name' nếu schema User có
      ],
      sort: { createdAt: -1 },
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Lỗi phân trang Attraction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const deleteAttraction = async (req, res) => {
  try {
    const { id } = req.params;
    const attraction = await Attractions.findById(id);

    if (!attraction) {
      return res.status(404).json({ message: 'Attraction not found' });
    }
    const getImageUrls = Array.isArray(attraction.list_image)
      ? attraction.list_image
      : JSON.parse(attraction.list_image || '[]');

    for (const imageUrl of getImageUrls) {
      const regex = /(?<=\/)[\w-]+(?=\.\w+$)/;
      const imageName = imageUrl.match(regex)?.[0];
      if (imageName) {
        await cloudinary.uploader.destroy(imageName, {
          invalidate: true,
        });
      }
    }
    const imageUrl = attraction.image;
    await cloudinary.uploader.destroy(imageUrl, {
      invalidate: true,
    });
    await Attractions.findByIdAndDelete(id);
    res.status(200).json({ message: 'Attraction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
const test = async (req, res) => {
  res.status(200).json({ message: 'test' });
};
module.exports = {
  createAttraction,
  getDetailAttraction,
  update,
  getAll,
  deleteAttraction,
  test,
};

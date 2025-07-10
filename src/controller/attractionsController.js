const Attractions = require('../models/AttractionsModel');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const mongoose = require('mongoose');

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
    const attraction = await Attractions.findById(id).exec();
    res.status(200).json({ attraction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
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

    if (req.files['image']) {
      const regex = /(?<=\/)[\w-]+(?=\.\w+$)/;
      const currentImageName = addressString.image?.match(regex)?.[0];
      if (currentImageName) {
        await cloudinary.uploader.destroy(currentImageName, {
          invalidate: true,
        });
      }
      addressString.image = req.files['image'][0].path;
    }

    if (req.files['list_image']) {
      const uploaded = req.files['list_image'].map((file) => file.path);
      const currentImages = Array.isArray(addressString.list_image)
        ? addressString.list_image
        : JSON.parse(addressString.list_image || '[]');
      addressString.list_image = [...currentImages, ...uploaded];
    }

    const address = JSON.parse(addressString);

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

    res.status(200).json({ attraction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { createAttraction, getDetailAttraction, update };

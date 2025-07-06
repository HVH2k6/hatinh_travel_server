const Attractions = require('../models/AttractionsModel');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Hàm tạo mới Attractions
const createAttraction = async (req, res) => {
  try {
    const {
      name,
      categoryId,
      typeId,
      image,

      list_image,
      address, // <- lấy string
      description,
      status,
      minPrice,
      maxPrice,
      isFree,
      isHot,
      mapUrl,
      openTime,
      createdBy,
    } = req.body;

    // Lưu thông tin Attraction mới vào database
    const attraction = await Attractions.create({
      name,
      image,
      list_image,
      categoryId,
      typeId,
      address,
      description,
      status,
      minPrice,
      maxPrice,
      isFree,
      isHot,
      mapUrl,
      openTime,
      createdBy, // Nếu bạn muốn lưu người tạo từ thông tin người dùng
    });

    res.status(200).json({ message: 'Attraction created successfully', attraction });
  } catch (error) {
    console.error(error);
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
      address: addressString, // <- lấy string
      description,
      status,
      minPrice,
      maxPrice,
      isFree,
      isHot,
      mapUrl,
      openTime,
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

    // ✅ Ảnh phụ
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
          isHot,
          mapUrl,
          openTime,
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

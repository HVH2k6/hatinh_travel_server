const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const axios = require('axios');

// Upload một ảnh đơn
const cloud = (req, res, next) => {
  if (!req.file) return next();

  const streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };

  (async () => {
    try {
      const result = await streamUpload(req);
      if (result?.secure_url) {
        req.body[req.file.fieldname] = result.secure_url;
        return res.send({
          message: 'Upload successfully',
          url: result.secure_url,
        });
      } else {
        return res.status(500).send('Upload failed: No URL returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).send('Error uploading image');
    }
  })();
};

// Upload nhiều ảnh
const cloudMultiple = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files uploaded');
  }

  const uploadFile = (file) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result.secure_url);
        } else {
          reject(error);
        }
      });
      streamifier.createReadStream(file.buffer).pipe(stream);
    });
  };

  (async () => {
    try {
      const uploadPromises = req.files.map((file) => uploadFile(file));
      const uploadResults = await Promise.all(uploadPromises);

      return res.send({
        message: 'Files uploaded successfully',
        urls: uploadResults,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      return res.status(500).send('Error uploading files');
    }
  })();
};

// Xoá ảnh theo URL
const deleteImage = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).send('No URL provided');

    const regex = /(?<=\/)[\w-]+(?=\.\w+$)/;
    const match = url.match(regex);
    const imageName = match?.[0];

    if (!imageName) {
      return res.status(400).send('Invalid image URL');
    }

    await cloudinary.api.delete_resources([imageName]);
    return res.send({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).send('Error deleting image');
  }
};

// Upload file lên Google Drive qua Apps Script
const drive = async (req, res, next) => {
  if (!req.file) return res.status(400).send('No file uploaded');

  try {
    const file = req.file;
    const data = file.buffer.toString('base64');

    const postData = {
      name: file.originalname,
      type: file.mimetype,
      data,
    };

    const response = await axios.post(
      'https://script.google.com/macros/s/AKfycbyWQxW4obs2OJTMHWSH0kd61ss6QEMNyV9BZ04oMVyYiLOzz9QLv4tfb7j0Ohk60bS7Fw/exec',
      postData,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data?.view) {
      return res.json(response.data);
    } else {
      throw new Error('No URL in response');
    }
  } catch (error) {
    console.error('Error uploading to Drive:', error);
    return res.status(500).send('Error uploading to Google Drive');
  }
};

module.exports = {
  cloud,
  drive,
  deleteImage,
  cloudMultiple,
};

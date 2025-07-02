const cloudinary = require("../config/cloudinary")
const streamifier = require("streamifier");


let loading = 0;

module.exports.cloud = async (req, res, next) => {
  console.log("req.files", req.files);
  if (!req.files) return next();

  try {
    const uploadSingleImage = (file) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result.secure_url);
          } else {
            reject(error);
          }
        });
        streamifier.createReadStream(file.buffer).pipe(stream);
      });
    };

    if (req.files["image"]) {
      req.body.image = await uploadSingleImage(req.files["image"][0]);
    }
    
    if (req.files["avatar"]) {
      req.body.avatar = await uploadSingleImage(req.files["avatar"][0]);
    }

    if (req.files["list_image"]) {
      console.log(12);
      req.body.list_image = await Promise.all(
        req.files["list_image"].map((file) => uploadSingleImage(file)),
        console.log(req.body.list_image)
      );
    }

    next();
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).send("Error uploading images");

  }
};
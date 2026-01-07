import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiErrorHandle } from "./ApiErrorHandle.js";
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });
cloudinary.config({
  cloud_name: "db7qmdfr2",
  api_key: "723248213726281",
  api_secret: "vcFR0cRfyiGf-GqlBJ4A7mtxGKU",
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new ApiErrorHandle(400, "No file path provided");
    }

    if (!fs.existsSync(localFilePath)) {
      throw new ApiErrorHandle(400, `File not found at path: ${localFilePath}`);
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    throw new ApiErrorHandle(
      error.statusCode || 500,
      "Cloudinary Upload Error: " + error.message
    );
  }
};

const updateImageOnCloudinary = async (oldImageUrl, newImagePath) => {
  try {
    if (!oldImageUrl || !newImagePath) {
      throw new ApiErrorHandle(400, "Image path not found");
    }

    if (!fs.existsSync(newImagePath)) {
      throw new ApiErrorHandle(400, "New image file not found on server");
    }

    const publicId = oldImageUrl.split("/").pop().split(".")[0];

    const response = await cloudinary.uploader.upload(newImagePath, {
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      resource_type: "auto",
    });

    fs.unlinkSync(newImagePath);

    return response.secure_url;
  } catch (error) {
    throw new ApiErrorHandle(
      error.statusCode || 500,
      "Cloudinary Upload Error: " + error.message
    );
  }
};

export { uploadOnCloudinary, updateImageOnCloudinary };

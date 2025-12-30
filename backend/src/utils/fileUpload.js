import { v2 as cloudinary } from "cloudinary";
import { existsSync, unlinkSync } from "fs";
import { ApiErrorHandle } from "./ApiErrorHandle.js";
import { ApiResponse } from "./ApiResponse.js";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new ApiErrorHandle(400, "No file path provided");
    }
    const response = await cloudinary.uploader.upload(localFilePath);
    if (existsSync(localFilePath)) {
      unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    if (localFilePath && existsSync(localFilePath)) {
      unlinkSync(localFilePath);
    }
    throw new ApiErrorHandle(500, "Cloudinary Upload Error: " + error.message);
  }
};

const updateImageOnCloudinary = async (OldImageUrl, newImageURL) => {
  try {
    if (!newImageURL || !OldImageUrl) {
      throw new ApiErrorHandle(400, "Image path not found.");
    }

    const publicId = OldImageUrl.split("/").pop().split(".")[0];
    const uploadImage = await cloudinary.uploader.upload(newImageURL, {
      public_id: publicId,
      overwrite: true,
      invalidate: true,
    });

    if (existsSync(newImageURL)) {
      unlinkSync(newImageURL);
    }

    return uploadImage.url;
  } catch (error) {
    throw new ApiErrorHandle(500, "Cloudinary Upload Error: " + error.message);
  }
};
export { uploadOnCloudinary, updateImageOnCloudinary };

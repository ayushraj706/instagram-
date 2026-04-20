import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (fileUrl: string, folder: string) => {
  return cloudinary.uploader.upload(fileUrl, {
    folder: `basekey/${folder}`,
    resource_type: "auto"
  });
};

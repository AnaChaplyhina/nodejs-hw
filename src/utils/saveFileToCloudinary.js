import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const saveFileToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        resource_type: 'image',
        overwrite: true,
        unique_filename: true,
        use_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    ).end(buffer); 
  });
};

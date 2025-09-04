import dotenv from 'dotenv';

dotenv.config();

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadPhotoOnCloudinary = async (fileInput) => {
  try {
    if (!fileInput) return null;

    console.log('Uploading to Cloudinary...');

    const uploadOptions = {
      resource_type: 'image',
      folder: process.env.CLOUDINARY_FOLDER || 'futurefind/profile_photos',
    };

    let cldnry_res;

    if (typeof fileInput === 'string') {
      // File path upload (local dev)
      cldnry_res = await cloudinary.uploader.upload(fileInput, uploadOptions);
      fs.unlinkSync(fileInput); // cleanup
    } else if (Buffer.isBuffer(fileInput)) {
      // Buffer upload (production)
      cldnry_res = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(fileInput); // ✅ correctly send buffer data
      });
    } else {
      throw new Error('Invalid file input type');
    }

    return {
      url: cldnry_res.secure_url,
      public_id: cldnry_res.public_id,
    };
  } catch (error) {
    if (typeof fileInput === 'string') {
      try {
        fs.unlinkSync(fileInput);
      } catch {}
    }
    console.error('CLOUDINARY :: FILE UPLOAD ERROR ', error);
    return null;
  }
};

const deleteImageOnCloudinary = async (publicId) => {
  try {
    if (!publicId) return false;

    console.log('deleting image from cloudinary...');

    const cldnry_res = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    return cldnry_res;
  } catch (error) {
    console.log('CLOUDINARY :: FILE Delete ERROR ', error);
    return false;
  }
};

export { uploadPhotoOnCloudinary, deleteImageOnCloudinary };

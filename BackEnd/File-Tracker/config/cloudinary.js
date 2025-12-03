import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ CLOUDINARY CREDENTIALS ARE MISSING!');
  console.error('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

console.log('✅ Cloudinary configured successfully for cloud:', cloudName);

// Test connection
cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connection test successful:', result);
  })
  .catch(err => {
    console.error('❌ Cloudinary connection test failed:', err.message);
  });

export const uploadToCloudinary = (fileBuffer, fileName, folder = 'File-Tracker') => {
  return new Promise((resolve, reject) => {
    const uniqueFilename = `file_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: folder,
        public_id: uniqueFilename,
        overwrite: false,
        unique_filename: true,
        use_filename: false,
        tags: ['file-tracker', 'upload']
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ File uploaded to Cloudinary:', {
            url: result.secure_url,
            public_id: result.public_id,
            folder: result.folder,
            bytes: result.bytes
          });
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    console.log('🗑️ Deleting from Cloudinary:', publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ Cloudinary deletion result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error);
    throw error;
  }
};

export const getCloudinaryUrl = (publicId) => {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'auto',
    flags: 'attachment' // Force download
  });
};

export default cloudinary;
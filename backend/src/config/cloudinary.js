import '../config/env.js';

import { v2 as cloudinary } from 'cloudinary';

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

export const isCloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME?.trim() && CLOUDINARY_API_KEY?.trim() && CLOUDINARY_API_SECRET?.trim()
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME.trim(),
    api_key: CLOUDINARY_API_KEY.trim(),
    api_secret: CLOUDINARY_API_SECRET.trim(),
    secure: true,
  });
}

export { cloudinary };
export default cloudinary;

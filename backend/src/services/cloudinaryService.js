import { Readable } from 'stream';
import { AppError } from '../utils/AppError.js';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

const CLOUDINARY_FOLDER = 'stratagen/campaigns';

const validateImageBuffer = (imageBuffer) => {
  if (!Buffer.isBuffer(imageBuffer)) {
    throw new AppError('An image buffer is required for Cloudinary upload.', 400);
  }

  if (imageBuffer.length === 0) {
    throw new AppError('Cannot upload an empty image buffer.', 400);
  }
};

const validateCloudinaryConfig = () => {
  if (!isCloudinaryConfigured) {
    throw new AppError(
      'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to backend/.env.',
      500
    );
  }
};

const uploadStream = (buffer, options) =>
  new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });

    Readable.from(buffer).pipe(upload);
  });

const mapCloudinaryError = (error) => {
  const statusCode = error?.http_code || error?.statusCode || 502;
  const message = error?.message || error?.error?.message || 'Cloudinary upload failed.';

  if (statusCode === 401 || statusCode === 403) {
    return new AppError(`Cloudinary authentication failed: ${message}`, 401);
  }

  if (statusCode === 429) {
    return new AppError(`Cloudinary rate limit exceeded: ${message}`, 429);
  }

  if (statusCode >= 500) {
    return new AppError(`Cloudinary service error: ${message}`, 502);
  }

  return new AppError(message, statusCode);
};

const handleUploadError = (error) => {
  if (error instanceof AppError) {
    throw error;
  }

  throw mapCloudinaryError(error);
};

export const uploadImage = async (imageBuffer) => {
  try {
    validateCloudinaryConfig();
    validateImageBuffer(imageBuffer);

    const result = await uploadStream(imageBuffer, {
      folder: CLOUDINARY_FOLDER,
      resource_type: 'image',
    });

    if (!result?.secure_url || !result?.public_id) {
      throw new AppError('Cloudinary did not return a valid upload response.', 502);
    }

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    handleUploadError(error);
  }
};

export default uploadImage;

import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(
  cloudName &&
  apiKey &&
  apiSecret &&
  cloudName !== 'your_cloud_name' &&
  apiKey !== 'your_api_key'
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  logger.info('Cloudinary initialized successfully', { cloudName });
} else {
  logger.warn('Cloudinary credentials not provided in .env. Falling back to local storage handler.');
}

export default cloudinary;

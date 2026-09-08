import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS } from '../config/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allowed MIME types
const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const createStorage = (folderName, allowedFormats = ['jpg', 'jpeg', 'png', 'webp']) => {
  if (isCloudinaryConfigured) {
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: folderName,
        allowed_formats: allowedFormats,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
    });
  }

  // Fallback to local disk storage
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const subDir = folderName.replace('kissansarthi/', '').replace('/', '_');
      const dir = path.join(uploadsDir, subDir);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
};

const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPG, PNG, and WebP images are allowed (max 5MB).', HTTP_STATUS.BAD_REQUEST), false);
  }
};

const docFileFilter = (req, file, cb) => {
  if (ALLOWED_DOCS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid document format. Only JPG, PNG, WebP, or PDF allowed (max 5MB).', HTTP_STATUS.BAD_REQUEST), false);
  }
};

// 1. Profile photos
export const uploadProfileImage = multer({
  storage: createStorage('kissansarthi/profile'),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('profileImage');

// 2. Marketplace produce listings (up to 3 photos)
export const uploadMarketplaceMedia = multer({
  storage: createStorage('kissansarthi/marketplace'),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).array('photos', 3);

// 4. Verification documents (KYC - land record / KCC)
export const uploadVerificationDoc = multer({
  storage: createStorage('kissansarthi/verification', ['jpg', 'jpeg', 'png', 'webp', 'pdf']),
  fileFilter: docFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('document');

// 5. Community posts
export const uploadPostMedia = multer({
  storage: createStorage('kissansarthi/community'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else if (ALLOWED_IMAGES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPG, PNG, WebP images and MP4 videos allowed.', HTTP_STATUS.BAD_REQUEST), false);
    }
  },
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max for media
}).fields([
  { name: 'images', maxCount: 4 },
  { name: 'video', maxCount: 1 },
  { name: 'videos', maxCount: 3 }
]);

export const uploadPostImage = multer({
  storage: createStorage('kissansarthi/community'),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('image');

/**
 * Returns accessible URL for uploaded file regardless of whether Cloudinary or local disk was used
 */
export const getFileUrl = (file, fallbackType = 'posts') => {
  if (!file) return null;
  if (file.path && file.path.startsWith('http')) {
    return file.path; // Cloudinary URL
  }
  const filename = file.filename || path.basename(file.path || '');
  return `/uploads/${fallbackType}/${filename}`;
};

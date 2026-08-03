import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { AppError } from '../utils/AppError.js';
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, UPLOAD_LIMITS } from '../config/constants.js';
import { HTTP_STATUS } from '../config/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = file.fieldname === 'profileImage' ? 'profiles' : 'posts';
    const dir = path.join(uploadsDir, subDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video' || file.fieldname === 'videos') {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only MP4, WebM, and OGG videos are allowed', HTTP_STATUS.BAD_REQUEST), false);
    }
  } else {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPEG, PNG, and WebP images are allowed', HTTP_STATUS.BAD_REQUEST), false);
    }
  }
};

export const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: UPLOAD_LIMITS.PROFILE_IMAGE },
}).single('profileImage');

export const uploadPostImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: UPLOAD_LIMITS.POST_IMAGE },
}).single('image');

export const uploadPostMedia = multer({
  storage,
  fileFilter,
  limits: { fileSize: Math.max(UPLOAD_LIMITS.POST_IMAGE, UPLOAD_LIMITS.POST_VIDEO) },
}).fields([
  { name: 'images', maxCount: 4 },
  { name: 'video', maxCount: 1 },
  { name: 'videos', maxCount: 3 }
]);

export const getUploadPath = (filename, type = 'posts') => {
  if (!filename) return null;
  return `/uploads/${type}/${filename.split(/[/\\]/).pop()}`;
};

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const resumesDir = path.join(uploadsDir, 'resumes');
const portfolioDir = path.join(uploadsDir, 'portfolio');
const attachmentsDir = path.join(uploadsDir, 'attachments');

[uploadsDir, avatarsDir, resumesDir, portfolioDir, attachmentsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = uploadsDir;
    if (file.fieldname === 'avatar') dest = avatarsDir;
    else if (file.fieldname === 'resume') dest = resumesDir;
    else if (file.fieldname === 'portfolio') dest = portfolioDir;
    else dest = attachmentsDir;
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter
const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Image upload (avatar, portfolio images)
const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
});

// Document upload (resume, PDF)
const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter(['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
});

// General attachment upload
const uploadAttachment = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter([
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip', 'text/plain',
  ]),
});

module.exports = { uploadImage, uploadDocument, uploadAttachment };

const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../uploads/courts');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = [
    'image/jpeg',
    'image/pjpeg',
    'image/png',
    'image/x-png',
    'image/gif',
    'image/webp'
];
const allowedExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const safeExt = allowedExtensions.includes(ext) ? (ext === '.jpeg' ? '.jpg' : ext) : '.jpg';
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    }
});

const fileFilter = (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const ext = path.extname(file.originalname || '').toLowerCase();

    if (allowedMimeTypes.includes(mime) || allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, GIF, or WebP images are allowed'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

/**
 * Expect form fields:
 * - image: single main court photo
 *
 */
module.exports = upload.fields([
    { name: 'image', maxCount: 1 },
    // secondary images are no longer supported
]);

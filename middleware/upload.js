const multer = require('multer');
const path = require('path');
const fs = require('fs');

const baseDir = path.join(__dirname, '..', 'public', 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
['photos', 'voice', 'letters'].forEach((d) => ensureDir(path.join(baseDir, d)));

function uniqueFilename(file) {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${unique}${path.extname(file.originalname)}`;
}

// Combined field upload for the complaint creation form (Module 2.1):
// up to 3 photos (max 5MB each) + 1 optional voice note (max 60s, enforced
// client-side in complaint-form.js via MediaRecorder timer).
const complaintFieldsUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'photos') cb(null, path.join(baseDir, 'photos'));
      else if (file.fieldname === 'voiceNote') cb(null, path.join(baseDir, 'voice'));
      else cb(new Error('Unexpected field'), null);
    },
    filename: (req, file, cb) => cb(null, uniqueFilename(file))
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'photos' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for photos'));
    }
    if (file.fieldname === 'voiceNote' && !file.mimetype.startsWith('audio/')) {
      return cb(new Error('Only audio files are allowed for the voice note'));
    }
    cb(null, true);
  }
}).fields([{ name: 'photos', maxCount: 3 }, { name: 'voiceNote', maxCount: 1 }]);

// Admin letter-generator upload (Module 3.2): scanned MLA recommendation letter.
const letterUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(baseDir, 'letters')),
    filename: (req, file, cb) => cb(null, uniqueFilename(file))
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = { complaintFieldsUpload, letterUpload };

const multer = require('multer');

const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/flac', 'audio/webm', 'audio/x-m4a', 'audio/mp3'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported audio format: ${file.mimetype}`));
        }
    }
});

// Timeout helper for async operations (prevents indefinite hangs)
const withTimeout = (promise, timeoutMs, label = 'Operation') => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs)
        )
    ]);
};

module.exports = { audioUpload, withTimeout };

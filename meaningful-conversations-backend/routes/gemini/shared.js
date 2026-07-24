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

/** Parse Gemini/Mistral structured JSON responses with sanitization fallbacks. */
function parseStructuredJsonResponse(rawText, label = 'response') {
    let cleanedText = (rawText || '').trim();
    const codeBlockRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
    const match = cleanedText.match(codeBlockRegex);
    if (match && match[1]) {
        cleanedText = match[1].trim();
    } else {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    try {
        return JSON.parse(cleanedText);
    } catch (firstParseErr) {
        try {
            const sanitizedText = cleanedText
                .replace(/""(\w+)":\s*:/g, '"$1":')
                .replace(/""(\w+)":/g, '"$1":')
                .replace(/"(\w+)"::/g, '"$1":')
                .replace(/:\s*\\"/g, ': "')
                .replace(/\\",/g, '",')
                .replace(/\\"(\s*[}\]])/g, '"$1')
                .replace(/\\"\s*\n/g, '"\n')
                .replace(/,(\s*[}\]])/g, '$1');
            return JSON.parse(sanitizedText);
        } catch (secondParseErr) {
            const err = new Error(`Failed to parse ${label} as JSON`);
            err.cause = firstParseErr;
            err.rawPreview = (rawText || '').substring(0, 500);
            throw err;
        }
    }
}

module.exports = { audioUpload, withTimeout, parseStructuredJsonResponse };

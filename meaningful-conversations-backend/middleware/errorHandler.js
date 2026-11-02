/**
 * Last-resort Express error middleware.
 * 5xx responses stay generic so internal messages are not returned to clients.
 */
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const rawStatus = Number(err.status || err.statusCode);
    const status = rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;

    if (status >= 500) {
        console.error('Unhandled route error:', err);
    }

    let message = 'Internal server error.';
    if (status < 500) {
        if (err.type === 'entity.parse.failed') {
            message = 'Invalid JSON body.';
        } else if (typeof err.publicMessage === 'string' && err.publicMessage) {
            message = err.publicMessage;
        } else {
            message = 'Bad request.';
        }
    }

    res.status(status).json({ error: message });
}

module.exports = { errorHandler };

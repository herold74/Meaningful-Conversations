/** `asyncHandler` wraps a single handler so rejections reach `next(err)`. */

function asyncHandler(fn) {
    return function wrappedAsync(req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// Express 5 forwards rejected promises from handlers to next(err) natively.
function installAsyncErrorForwarding() {}

module.exports = { asyncHandler, installAsyncErrorForwarding };

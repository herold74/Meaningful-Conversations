/**
 * Express 4 does not forward rejections from async route handlers.
 * `asyncHandler` wraps a single handler. `installAsyncErrorForwarding`
 * patches every router layer so a thrown or rejected handler reaches `next(err)`
 * instead of becoming an unhandled rejection (Node 22 exits on those).
 */

function asyncHandler(fn) {
    return function wrappedAsync(req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

let installed = false;

function installAsyncErrorForwarding() {
    if (installed) return;
    installed = true;

    const Layer = require('express/lib/router/layer');
    const original = Layer.prototype.handle_request;

    Layer.prototype.handle_request = function handleRequest(req, res, next) {
        const fn = this.handle;
        if (fn.length > 3) {
            return next();
        }
        try {
            const result = fn(req, res, next);
            if (result && typeof result.then === 'function') {
                result.then(undefined, next);
            }
        } catch (err) {
            next(err);
        }
        return undefined;
    };

    // Keep the original available for debugging; the patch replaces it.
    Layer.prototype.handle_request._original = original;
}

module.exports = { asyncHandler, installAsyncErrorForwarding };

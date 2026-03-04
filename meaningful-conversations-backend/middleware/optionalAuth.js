const jwt = require('jsonwebtoken');
const { isTokenInvalidated } = require('../services/tokenInvalidation.js');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            if (!isTokenInvalidated(decodedToken.userId, decodedToken.iat)) {
                req.userId = decodedToken.userId;
            }
        }
    } catch (error) {
        // Invalid token is ignored, just proceed without a user ID
    }
    next();
};
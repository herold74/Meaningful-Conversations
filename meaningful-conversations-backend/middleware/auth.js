const jwt = require('jsonwebtoken');
const { isTokenInvalidated } = require('../services/tokenInvalidation.js');
const { recordActivity } = require('../services/activityTracker.js');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required: No token provided.' });
        }
        
        const token = authHeader.split(' ')[1];
        
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        if (isTokenInvalidated(decodedToken.userId, decodedToken.iat)) {
            return res.status(401).json({ error: 'Token has been invalidated. Please log in again.' });
        }
        
        req.userId = decodedToken.userId;
        if (!req.path.startsWith('/admin/')) recordActivity();
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed: Invalid token.' });
    }
};

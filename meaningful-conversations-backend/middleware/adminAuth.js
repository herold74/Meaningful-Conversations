const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient.js');
const { isTokenInvalidated } = require('../services/tokenInvalidation.js');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required: No token provided.' });
        }
        
        const token = authHeader.split(' ')[1];
        
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({ where: { id: decodedToken.userId } });

        if (!user || user.status !== 'ACTIVE') {
            return res.status(401).json({ error: 'Authentication failed: Invalid token.' });
        }

        if (await isTokenInvalidated(decodedToken.userId, decodedToken.iat)) {
            return res.status(401).json({ error: 'Token has been invalidated. Please log in again.' });
        }

        if (!user.isAdmin && !user.isDeveloper) {
            return res.status(403).json({ error: 'Forbidden: Admin access required.' });
        }
        
        req.userId = decodedToken.userId;
        req.user = user;  // Make full user object available to routes
        
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed: Invalid token.' });
    }
};

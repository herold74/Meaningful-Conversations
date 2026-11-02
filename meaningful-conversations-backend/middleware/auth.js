const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient.js');
const { isTokenInvalidated } = require('../services/tokenInvalidation.js');
const { recordActivity } = require('../services/activityTracker.js');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required: No token provided.' });
        }
        
        const token = authHeader.split(' ')[1];
        
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decodedToken.userId },
            select: { status: true },
        });
        if (!user || user.status !== 'ACTIVE') {
            return res.status(401).json({ error: 'Authentication failed: Invalid token.' });
        }
        
        if (await isTokenInvalidated(decodedToken.userId, decodedToken.iat)) {
            return res.status(401).json({ error: 'Token has been invalidated. Please log in again.' });
        }
        
        req.userId = decodedToken.userId;
        if (!req.path.startsWith('/admin/')) recordActivity();
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed: Invalid token.' });
    }
};

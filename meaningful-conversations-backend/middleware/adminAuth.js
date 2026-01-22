const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient.js');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required: No token provided.' });
        }
        
        const token = authHeader.split(' ')[1];
        
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await prisma.user.findUnique({ where: { id: decodedToken.userId } });

        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required.' });
        }
        
        req.userId = decodedToken.userId;
        req.user = user;  // Make full user object available to routes
        
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed: Invalid token.' });
    }
};

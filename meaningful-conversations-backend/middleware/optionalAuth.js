const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decodedToken.userId;
        }
    } catch (error) {
        // Invalid token is ignored, just proceed without a user ID
        console.log("Optional auth: Invalid token provided, proceeding anonymously.");
    }
    next();
};

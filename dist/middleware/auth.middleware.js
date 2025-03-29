"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const authMiddleware = (req, res, next) => {
    next();
    // Get the token from the header
    // const token = req.headers.authorization?.split(' ')[1];
    // if (!token) {
    //   return res.status(401).json({ error: 'No token provided' });
    // }
    // try {
    //   // Verify token
    //   const decoded = jwt.verify(token, config.jwtSecret) as { id: string; walletAddress: string };
    //   // Add user from payload to request
    //   req.user = {
    //     id: decoded.id,
    //     walletAddress: decoded.walletAddress
    //   };
    //   next();
    // } catch (error) {
    //   return res.status(401).json({ error: 'Invalid token' });
    // }
};
exports.authMiddleware = authMiddleware;

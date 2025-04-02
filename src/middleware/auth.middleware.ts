import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  req.user = {
    id: "1f8bacf8-b719-496f-a996-b3d0f2c79f44",
    walletAddress: "0x8945dede1d19a582381c88d1ee6fe5e503d65f56"
  };

  next()
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
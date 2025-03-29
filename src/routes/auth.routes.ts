// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Get nonce for wallet signature
router.get('/nonce/:address', authController.getNonce.bind(authController));

// Connect wallet (verify signature)
router.post('/connect', authController.connect.bind(authController));

// Register new user
router.post('/register', authController.register.bind(authController));

export default router;
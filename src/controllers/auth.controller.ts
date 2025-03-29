// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { NonceRequest, ConnectRequest, RegisterRequest } from '../interfaces/auth.interface';

const authService = new AuthService();

export class AuthController {
  /**
   * Generate a nonce for wallet signature
   */
  async getNonce(req: Request, res: Response): Promise<void> {
    try {
      const data: NonceRequest = {
        walletAddress: req.params.address
      };
      
      const result = await authService.generateNonce(data);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error generating nonce:', error);
      res.status(500).json({ error: 'Failed to generate nonce' });
    }
  }

  /**
   * Verify wallet signature and authenticate user
   */
  async connect(req: Request, res: Response): Promise<void> {
    try {
      const data: ConnectRequest = req.body;
      const result = await authService.connectWallet(data);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Register new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const data: RegisterRequest = req.body;
      const result = await authService.registerUser(data);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error registering user:', error);
      res.status(400).json({ error: error.message });
    }
  }
}
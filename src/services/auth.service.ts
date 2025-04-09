import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import prisma from '../config/database';
import config from '../config/env';
import { AuthResponse, ConnectRequest, NonceRequest, RegisterRequest } from '../interfaces/auth.interface';

const nonceStore = new Map<string, { nonce: string, expiresAt: Date }>();

export class AuthService {
  async generateNonce(data: NonceRequest): Promise<{ nonce: string; expiresAt: number }> {
    const { walletAddress } = data;
    
    // Generate a random nonce
    const nonce = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    
    // Set expiration time (5 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.nonceExpirationMinutes);
    
    // Store the nonce
    nonceStore.set(walletAddress.toLowerCase(), { 
      nonce, 
      expiresAt 
    });
    
    console.log(`Generated nonce for ${walletAddress.toLowerCase()}: ${nonce}`);
    
    return {
      nonce,
      expiresAt: expiresAt.getTime()
    };
  }

  async connectWallet(data: ConnectRequest): Promise<AuthResponse> {
    const { walletAddress, signature } = data;
    
    // Get the stored nonce
    const storedNonce = nonceStore.get(walletAddress.toLowerCase());
    
    if (!storedNonce) {
      throw new Error('Nonce not found. Please request a new nonce.');
    }
    
    if (new Date() > storedNonce.expiresAt) {
      // Clean up expired nonce
      nonceStore.delete(walletAddress.toLowerCase());
      throw new Error('Nonce expired. Please request a new nonce.');
    }
    
    // Create the message that was signed
    const message = `Sign this message to authenticate with FileCoin Model Hub: ${storedNonce.nonce}`;
    console.log(`Verifying message: "${message}" for ${walletAddress}`);
    
    try {
      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      console.log(`Recovered address: ${recoveredAddress}, Expected: ${walletAddress}`);
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Invalid signature');
      }
    } catch (error: any) {
      console.error('Signature verification error:', error);
      throw new Error(`Invalid signature: ${error.message}`);
    }
    
    // Find user
    let user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress }
    });
    
    // Only delete the nonce if we're done with it
    if (user) {
      // User exists, we can delete the nonce
      nonceStore.delete(walletAddress.toLowerCase());
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, walletAddress: user.walletAddress },
        config.jwtSecret as any,
        { expiresIn: config.jwtExpiresIn } as any
      );
      
      return {
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          username: user.username
        }
      };
    } else {
      // We keep the nonce for potential registration
      throw new Error('User not found. Please register first.');
    }
  }

  async registerUser(data: RegisterRequest): Promise<AuthResponse> {
    const { walletAddress, signature, username, bio } = data;
    
    // Verify signature (same as in connectWallet)
    const storedNonce = nonceStore.get(walletAddress.toLowerCase());
    
    if (!storedNonce) {
      throw new Error('Nonce not found. Please request a new nonce.');
    }
    
    if (new Date() > storedNonce.expiresAt) {
      nonceStore.delete(walletAddress.toLowerCase());
      throw new Error('Nonce expired. Please request a new nonce.');
    }
    
    const message = `Sign this message to authenticate with FileCoin Model Hub: ${storedNonce.nonce}`;
    console.log(`Verifying registration message: "${message}" for ${walletAddress}`);
    
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      console.log(`Registration - Recovered address: ${recoveredAddress}, Expected: ${walletAddress}`);
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Invalid signature');
      }
    } catch (error: any) {
      console.error('Registration signature verification error:', error);
      throw new Error(`Invalid signature: ${error.message}`);
    }
    
    // Clean up used nonce
    nonceStore.delete(walletAddress.toLowerCase());
    
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress }
    });
    
    if (user) {
      throw new Error('User already exists');
    }
    
    // Create new user
    user = await prisma.user.create({
      data: {
        walletAddress,
        username,
        bio
      }
    });
    
    const token = jwt.sign(
      { id: user.id, walletAddress: user.walletAddress },
      config.jwtSecret as any,
      { expiresIn: config.jwtExpiresIn } as any
    );
    
    return {
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        bio: user.bio,
        createdAt: user.createdAt.toISOString()
      }
    };
  }
}
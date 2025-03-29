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
    
    return {
      nonce,
      expiresAt: expiresAt.getTime()
    };
  }

  /**
   * Verify wallet signature and authenticate user
   */
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
    
    try {
      // Handle different signature formats
      let signatureToVerify = signature;
      
      // If signature starts with '0x' but doesn't have a recovery id, try to add it
      if (signature.startsWith('0x') && signature.length === 130) {
        // Add recovery id 27 (0x1b) - This is a common default
        signatureToVerify = signature + '1b';
        console.log('Added recovery id to signature');
      }
      
      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(message, signatureToVerify);
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Invalid signature');
      }
    } catch (error: any) {
      console.error('Signature verification error:', error);
      throw new Error(`Invalid signature: ${error.message}`);
    }
    
    // Clean up used nonce
    nonceStore.delete(walletAddress.toLowerCase());
    
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress }
    });
    
    if (!user) {
      throw new Error('User not found. Please register first.');
    }
    
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
}

  /**
   * Register new user
   */
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
    
    const message = `Sign this message to register with FileCoin Model Hub: ${storedNonce.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Invalid signature');
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
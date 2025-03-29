"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ethers_1 = require("ethers");
const database_1 = __importDefault(require("../config/database"));
const env_1 = __importDefault(require("../config/env"));
// In-memory storage for nonces
const nonceStore = new Map();
class AuthService {
    /**
     * Generate a nonce for wallet signature
     */
    async generateNonce(data) {
        const { walletAddress } = data;
        // Generate a random nonce
        const nonce = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
        // Set expiration time (5 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + env_1.default.nonceExpirationMinutes);
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
    async connectWallet(data) {
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
        // Verify the signature
        const recoveredAddress = ethers_1.ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            throw new Error('Invalid signature');
        }
        // Clean up used nonce
        nonceStore.delete(walletAddress.toLowerCase());
        // Find or create user
        let user = await database_1.default.user.findUnique({
            where: { walletAddress: walletAddress }
        });
        if (!user) {
            throw new Error('User not found. Please register first.');
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, walletAddress: user.walletAddress }, env_1.default.jwtSecret, { expiresIn: env_1.default.jwtExpiresIn });
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
    async registerUser(data) {
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
        const recoveredAddress = ethers_1.ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            throw new Error('Invalid signature');
        }
        // Clean up used nonce
        nonceStore.delete(walletAddress.toLowerCase());
        // Check if user already exists
        let user = await database_1.default.user.findUnique({
            where: { walletAddress: walletAddress }
        });
        if (user) {
            throw new Error('User already exists');
        }
        // Create new user
        user = await database_1.default.user.create({
            data: {
                walletAddress,
                username,
                bio
            }
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, walletAddress: user.walletAddress }, env_1.default.jwtSecret, { expiresIn: env_1.default.jwtExpiresIn });
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
exports.AuthService = AuthService;

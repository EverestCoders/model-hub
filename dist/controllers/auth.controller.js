"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const authService = new auth_service_1.AuthService();
class AuthController {
    /**
     * Generate a nonce for wallet signature
     */
    async getNonce(req, res) {
        try {
            const data = {
                walletAddress: req.params.address
            };
            const result = await authService.generateNonce(data);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error generating nonce:', error);
            res.status(500).json({ error: 'Failed to generate nonce' });
        }
    }
    /**
     * Verify wallet signature and authenticate user
     */
    async connect(req, res) {
        try {
            const data = req.body;
            const result = await authService.connectWallet(data);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error connecting wallet:', error);
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * Register new user
     */
    async register(req, res) {
        try {
            const data = req.body;
            const result = await authService.registerUser(data);
            res.status(201).json(result);
        }
        catch (error) {
            console.error('Error registering user:', error);
            res.status(400).json({ error: error.message });
        }
    }
}
exports.AuthController = AuthController;

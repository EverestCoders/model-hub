"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.routes.ts
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// Get nonce for wallet signature
router.get('/nonce/:address', authController.getNonce.bind(authController));
// Connect wallet (verify signature)
router.post('/connect', authController.connect.bind(authController));
// Register new user
router.post('/register', authController.register.bind(authController));
exports.default = router;

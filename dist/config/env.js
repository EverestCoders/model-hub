"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.default = {
    port: process.env.PORT || 3002,
    jwtSecret: process.env.JWT_SECRET || 'default-secret-key',
    jwtExpiresIn: '24h',
    nonceExpirationMinutes: 5,
};

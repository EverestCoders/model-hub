import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 3002,
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key',
  jwtExpiresIn: '24h',
  nonceExpirationMinutes: 5,
};
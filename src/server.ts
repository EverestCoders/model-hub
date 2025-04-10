import app from './app';
import config from './config/env';
import prisma from './config/database';
import fs from 'fs'; 
import path from 'path';

const PORT = config.port || 3000;const uploadDirs = [
  path.join(__dirname, '../uploads'),
  path.join(__dirname, '../uploads/temp'),
  path.join(__dirname, '../uploads/zip'),
  path.join(__dirname, '../uploads/processing')
];

for (const dir of uploadDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}


async function startServer() {
  try {
    await prisma.$connect();
    console.log('Connected to database');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Disconnected from database');
  process.exit(0);
});
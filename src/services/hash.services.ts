// src/services/hash.service.ts

import crypto from 'crypto';
import fs from 'fs';
import { Readable } from 'stream';

export class HashService {
  /**
   * Generate SHA-256 hash from file buffer
   */
  generateFileHash(fileBuffer: Buffer): string {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Generate SHA-256 hash from file path
   */
  async generateFileHashFromPath(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('error', err => reject(err));
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  /**
   * Verify if calculated hash matches expected hash
   */
  verifyHash(calculatedHash: string, expectedHash: string): boolean {
    return calculatedHash === expectedHash;
  }

  /**
   * Verify file integrity against expected hash
   */
  async verifyFileIntegrity(fileBuffer: Buffer, expectedHash: string): Promise<boolean> {
    const calculatedHash = this.generateFileHash(fileBuffer);
    return this.verifyHash(calculatedHash, expectedHash);
  }
}
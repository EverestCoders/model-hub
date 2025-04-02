// src/services/storage.service.ts

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import lighthouse from '@lighthouse-web3/sdk';

// Normally this would be a real integration with Lighthouse
// This is a mock implementation for development purposes
export class StorageService {
  private prisma: PrismaClient;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async uploadModelDirectory(modelFiles: Express.Multer.File[], metadata: any): Promise<{ filecoinCid: string, metadataCid: string, hash: string, sizeBytes: number }> {
    try {
      // Create a temporary directory to store the model files
      const tempDirPath = `/tmp/model_upload_${uuidv4()}`;
      fs.mkdirSync(tempDirPath, { recursive: true });
      
      let totalSize = 0;
      
      // Write all files to the temporary directory
      for (const file of modelFiles) {
        const filePath = path.join(tempDirPath, file.originalname);
        fs.writeFileSync(filePath, file.buffer);
        totalSize += file.size;
      }

      const uniqueIdentifier = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Upload directory to Lighthouse
      const uploadResponse = await lighthouse.upload(tempDirPath, process.env.LIGHTHOUSE_API_KEY as string);
      const filecoinCid = uploadResponse.data.Hash;
      
      // Upload metadata to Lighthouse
      const metadataJson = JSON.stringify(metadata);
      const metadataPath = path.join(tempDirPath, 'metadata.json');
      fs.writeFileSync(metadataPath, metadataJson);
      const metadataResponse = await lighthouse.upload(metadataPath, process.env.LIGHTHOUSE_API_KEY as string);
      const metadataCid = metadataResponse.data.Hash;
      
      // Calculate hash of the entire directory
      let combinedHash = crypto.createHash('sha256');
      for (const file of modelFiles) {
        combinedHash.update(file.buffer);
      }
      const hash = combinedHash.digest('hex');
      
      // Clean up temp directory
      fs.rmSync(tempDirPath, { recursive: true, force: true });
      
      return {
        filecoinCid,
        metadataCid,
        hash,
        sizeBytes: totalSize
      };
    } catch (error: any) {
      console.error("Error uploading to Lighthouse:", error);
      throw new Error(`Failed to upload model directory to Lighthouse: ${error.message}`);
    }
  }

  async downloadModel(cid: string): Promise<string> {
    // Mock implementation - in production this would generate a real gateway URL
    return `https://gateway.lighthouse.storage/ipfs/${cid}`;
  }

  async getMetadata(metadataCid: string): Promise<any> {
    // Mock implementation
    return {
      createdAt: new Date().toISOString(),
      format: 'safetensors',
      type: 'diffusion'
    };
  }

  getStorageDeals(cid: string): Promise<{ activeDeals: number, totalDeals: number }> {
    // Mock implementation
    return Promise.resolve({
      activeDeals: 3,
      totalDeals: 5
    });
  }

  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
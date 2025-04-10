// src/services/storage.service.ts

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import lighthouse from '@lighthouse-web3/sdk';
import decompress from 'decompress';
import archiver from 'archiver';

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
      const tempId = uuidv4();
      const tempDirPath = path.join(process.cwd(), 'uploads', 'processing', tempId);
      const extractPath = path.join(tempDirPath, 'extracted');

      fs.mkdirSync(tempDirPath, { recursive: true });
      fs.mkdirSync(extractPath, { recursive: true });

      // Create a zip file from the uploaded files
      const zipPath = path.join(tempDirPath, 'model.zip');

      console.log("zipPath", zipPath);
      
      // Write all files to the temporary directory first
      let totalSize = 0;
      for (const file of modelFiles) {
        const filePath = path.join(tempDirPath, file.originalname);
        fs.writeFileSync(filePath, file.buffer);
        totalSize += file.size;
      }
      
      // Create a zip file (we'll zip the files to make them easier to handle)
      await this.createZipFromDirectory(tempDirPath, zipPath, ['model.zip']);
      
      // Now extract the zip to the extracted directory
      await decompress(zipPath, extractPath);

      console.log(`Extracted model files to ${extractPath}`);
      
      // Recalculate the total size of all files in the extract directory
      totalSize = 0;
      const filePaths: string[] = [];

      const getAllFiles = (dir: string) => {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory()) {
            getAllFiles(filePath);
          } else {
            filePaths.push(filePath);
            totalSize += stats.size;
          }
        }
      };
      
      getAllFiles(extractPath);
      console.log(`Total model size: ${totalSize} bytes (${(totalSize / (1024 * 1024)).toFixed(2)} MB)`);

      const LARGE_FILE_THRESHOLD = 500 * 1024 * 1024;

      let filecoinCid: string;
      if (totalSize > LARGE_FILE_THRESHOLD) {
        console.log(`Large model detected, using chunked upload approach`);
        
        // For very large files, we would need a specialized approach with Lighthouse
        // Here we'll still use their standard API but note this should be enhanced
        // for production with proper chunking support
        const uploadResponse = await lighthouse.upload(extractPath, process.env.LIGHTHOUSE_API_KEY as string);
        filecoinCid = uploadResponse.data.Hash;
      } else {
        console.log(`Standard size model, using direct upload`);
        const uploadResponse = await lighthouse.upload(extractPath, process.env.LIGHTHOUSE_API_KEY as string);
        filecoinCid = uploadResponse.data.Hash;
      }
      
      // Upload metadata to Lighthouse
      const metadataJson = JSON.stringify(metadata);
      const metadataPath = path.join(tempDirPath, 'metadata.json');
      fs.writeFileSync(metadataPath, metadataJson);
      const metadataResponse = await lighthouse.upload(metadataPath, process.env.LIGHTHOUSE_API_KEY as string);
      const metadataCid = metadataResponse.data.Hash;
      
      // Calculate hash of the entire directory
      const hash = await this.calculateDirectoryHash(extractPath);
      
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

  // Helper method to create a zip file from a directory
  private createZipFromDirectory(sourceDir: string, outputPath: string, excludeFiles: string[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', {
          zlib: { level: 9 } // Maximum compression
        });
        
        output.on('close', () => {
          console.log(`Archive created: ${archive.pointer()} total bytes`);
          resolve();
        });
        
        archive.on('error', (err) => {
          reject(err);
        });
        
        archive.pipe(output);
        
        // Add files from the directory to the zip, excluding specific files
        const files = fs.readdirSync(sourceDir);
        for (const file of files) {
          if (excludeFiles.includes(file)) continue;
          
          const filePath = path.join(sourceDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isDirectory()) {
            archive.directory(filePath, file);
          } else {
            archive.file(filePath, { name: file });
          }
        }
        
        archive.finalize();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Method to calculate a hash of all files in a directory
  private async calculateDirectoryHash(directoryPath: string): Promise<string> {
    const combinedHash = crypto.createHash('sha256');
    const processDirectory = async (dir: string) => {
      const files = fs.readdirSync(dir).sort(); // Sort for deterministic order
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          await processDirectory(filePath);
        } else {
          const fileData = fs.readFileSync(filePath);
          combinedHash.update(fileData);
        }
      }
    };
    
    await processDirectory(directoryPath);
    return combinedHash.digest('hex');
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
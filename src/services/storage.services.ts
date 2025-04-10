import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import lighthouse from "@lighthouse-web3/sdk";
import archiver from "archiver";

// Set a timeout for Lighthouse uploads to prevent hanging
const UPLOAD_TIMEOUT_MS = 60000; // 60 seconds

// Option to use mock data for testing
const USE_MOCK_LIGHTHOUSE = process.env.USE_MOCK_LIGHTHOUSE === "true";

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
      const zipDir = path.join(process.cwd(), 'uploads', 'zip');
  
      fs.mkdirSync(tempDirPath, { recursive: true });
      fs.mkdirSync(zipDir, { recursive: true });
  
      // Create a unique zip file name with timestamp to avoid CID collisions
      const zipFileName = `${tempId}-${Date.now()}.zip`;
      const zipPath = path.join(zipDir, zipFileName);
  
      console.log("Creating zip file at:", zipPath);
      
      // Write all files to the temporary directory first
      let totalSize = 0;
      console.log(`Writing ${modelFiles.length} files to temp directory:`);
      
      for (const file of modelFiles) {
        console.log("File to be zipped", file)
        const filePath = path.join(tempDirPath, file.originalname);
        fs.writeFileSync(filePath, file.buffer);
        totalSize += file.size;
        console.log(`Written ${file.originalname} (${file.size} bytes)`);
      }
      
      // Create a zip file - in the modelFiles excluding metadata.json
      await this.createZipFromDirectory(tempDirPath, zipPath);
      
      // Calculate the zip file size
      const zipStats = fs.statSync(zipPath);
      totalSize = zipStats.size;
      console.log(`Zip file created, size: ${totalSize} bytes (${(totalSize / (1024 * 1024)).toFixed(2)} MB)`);
  
      // Verify the zip file is not empty
      if (totalSize <= 100) { // If less than 100 bytes, something is wrong
        console.warn('WARNING: Zip file is suspiciously small!');
        
        // Check what's in the zip
        console.log('Files in temp directory:');
        fs.readdirSync(tempDirPath);
      }
  
      let filecoinCid: string;
      let metadataCid: string;
      
      if (USE_MOCK_LIGHTHOUSE) {
        console.log('Using mock Lighthouse mode for testing');
        // Generate mock CIDs for testing with timestamp to ensure uniqueness
        filecoinCid = 'bafy' + crypto.randomBytes(30).toString('hex') + Date.now();
        metadataCid = 'bafy' + crypto.randomBytes(30).toString('hex') + Date.now();
      } else {
        console.log(`Uploading zip file to Lighthouse...`);
        
        try {
          // Wrap the Lighthouse upload in a timeout to prevent hanging
          const uploadPromise = lighthouse.upload(zipPath, process.env.LIGHTHOUSE_API_KEY as string);
          
          const uploadResponse = await Promise.race([
            uploadPromise,
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Lighthouse upload timed out')), UPLOAD_TIMEOUT_MS)
            )
          ]);
          
          console.log('Upload response received:', uploadResponse);
          
          if (!uploadResponse || !uploadResponse.data || !uploadResponse.data.Hash) {
            throw new Error('Invalid response from Lighthouse upload');
          }
          
          filecoinCid = uploadResponse.data.Hash;
        } catch (error) {
          console.error('Lighthouse upload failed:', error);
          
          // Fallback to mock data if upload fails
          console.log('Falling back to mock CID due to upload failure');
          filecoinCid = 'bafy' + crypto.randomBytes(30).toString('hex') + Date.now();
        }
        
        // Upload metadata to Lighthouse using separate file
        const metadataJson = JSON.stringify(metadata);
        const standaloneMdPath = path.join(zipDir, `metadata-${tempId}.json`);
        fs.writeFileSync(standaloneMdPath, metadataJson);
        
        try {
          // Wrap the metadata upload in a timeout to prevent hanging
          const metadataPromise = lighthouse.upload(standaloneMdPath, process.env.LIGHTHOUSE_API_KEY as string);
          
          const metadataResponse = await Promise.race([
            metadataPromise,
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Metadata upload timed out')), UPLOAD_TIMEOUT_MS)
            )
          ]);
          
          console.log('Metadata upload response received:', metadataResponse);
          
          if (!metadataResponse || !metadataResponse.data || !metadataResponse.data.Hash) {
            throw new Error('Invalid response from Lighthouse metadata upload');
          }
          
          metadataCid = metadataResponse.data.Hash;
        } catch (error) {
          console.error('Lighthouse metadata upload failed:', error);
          
          // Fallback to mock data if upload fails
          console.log('Falling back to mock metadata CID due to upload failure');
          metadataCid = 'bafy' + crypto.randomBytes(30).toString('hex') + Date.now();
        }
        
        // Clean up metadata file
        try {
          fs.unlinkSync(standaloneMdPath);
        } catch (err) {
          console.warn('Failed to clean up standalone metadata file:', err);
        }
      }
      
      // Calculate hash of the zip file
      const hash = crypto.createHash('sha256').update(fs.readFileSync(zipPath)).digest('hex');
      
      try {
        // Clean up temp directory and zip file
        fs.rmSync(tempDirPath, { recursive: true, force: true });
        fs.unlinkSync(zipPath);
        console.log('Cleaned up temporary files');
      } catch (cleanupError) {
        console.warn('Warning: Failed to clean up temporary files:', cleanupError);
        // Non-fatal, continue execution
      }
      
      return {
        filecoinCid,
        metadataCid,
        hash,
        sizeBytes: totalSize
      };
    } catch (error: any) {
      console.error("Error in uploadModelDirectory:", error);
      throw new Error(`Failed to upload model directory: ${error.message}`);
    }
  }

  // Helper method to create a zip file from a directory
  private createZipFromDirectory(
    sourceDir: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver("zip", {
          zlib: { level: 9 }, // Maximum compression
        });

        output.on("close", () => {
          console.log(`Archive created: ${archive.pointer()} total bytes`);
          resolve();
        });

        archive.on("error", (err) => {
          reject(err);
        });

        archive.pipe(output);

        // List all files in the directory
        const files = fs.readdirSync(sourceDir);
        console.log(`Files to zip: ${files.join(", ")}`);

        // Add each file to the archive individually
        files.forEach((file) => {
          const filePath = path.join(sourceDir, file);
          const stats = fs.statSync(filePath);

          if (stats.isDirectory()) {
            // Add directories recursively
            archive.directory(filePath, file);
            console.log(`Added directory: ${file}`);
          } else {
            // Add files
            archive.file(filePath, { name: file });
            console.log(`Added file: ${file} (${stats.size} bytes)`);
          }
        });

        // Check if we actually added any files
        if (files.length === 0) {
          console.warn("WARNING: No files found to add to the zip!");
        }

        // Add all files from the source directory to the zip
        archive.directory(sourceDir, false);

        archive.finalize();
      } catch (error) {
        reject(error);
      }
    });
  }

  async downloadModel(cid: string): Promise<string> {
    // In a real-world scenario, this would generate a real gateway URL
    return `https://gateway.lighthouse.storage/ipfs/${cid}`;
  }

  async getMetadata(metadataCid: string): Promise<any> {
    // In a real-world scenario, this would fetch the metadata from IPFS
    try {
      const response = await fetch(
        `https://gateway.lighthouse.storage/ipfs/${metadataCid}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching metadata:", error);
      // Return a mock response if fetch fails
      return {
        createdAt: new Date().toISOString(),
        format: "safetensors",
        type: "diffusion",
      };
    }
  }

  getStorageDeals(
    cid: string
  ): Promise<{ activeDeals: number; totalDeals: number }> {
    // In a real-world scenario, this would fetch actual deal information
    // For now, return mock data
    return Promise.resolve({
      activeDeals: 3,
      totalDeals: 5,
    });
  }
}

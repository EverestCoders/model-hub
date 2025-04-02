import { PrismaClient, Model, ModelVersion } from '@prisma/client';
import { StorageService } from './storage.services';
import { BlockchainService } from './blockchain.service';
import crypto from 'crypto';

export class VersioningService {
  private prisma: PrismaClient;
  private storageService: StorageService;
  private blockchainService: BlockchainService;

  constructor(
    prisma: PrismaClient, 
    storageService: StorageService,
    blockchainService: BlockchainService
  ) {
    this.prisma = prisma;
    this.storageService = storageService;
    this.blockchainService = blockchainService;
  }

  async createInitialVersion(
    modelId: string, 
    modelFiles: Express.Multer.File[], 
    metadata: any, 
    commitMessage?: string
  ): Promise<ModelVersion> {
    // Upload to storage
    const { filecoinCid, metadataCid, hash, sizeBytes } = await this.storageService.uploadModelDirectory(modelFiles, {
      ...metadata,
      _uniqueId: `initial_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    });
    
    // Get the model
    const model = await this.prisma.model.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      throw new Error('Model not found');
    }

    // Register on blockchain (mock)
    const txHash = await this.blockchainService.registerModelVersion(
      filecoinCid, 
      null, 
      metadataCid, 
      hash
    );

    // Create version in database
    const version = await this.prisma.modelVersion. create({
      data: {
        modelId: modelId,
        versionNumber: 1,
        filecoinCid,
        metadataCid,
        hash,
        commitMessage,
        txHash,
        sizeBytes,
        parameters: metadata.parameters || null
      }
    });

    for (const file of modelFiles) {
      const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
      
      await this.prisma.modelFile.create({
        data: {
          modelId,
          versionId: version.id,
          filename: file.originalname,
          path: file.originalname, // Simple case - might need to parse path from filename
          sizeBytes: file.size,
          mimeType: file.mimetype,
          hash: fileHash
        }
      });
    }

    // Update the model's latestVersionId
    await this.prisma.model.update({
      where: { id: modelId },
      data: { latestVersionId: version.id }
    });

    return version;
  }

  async createNewVersion(
    modelId: string, 
    modelFiles: Express.Multer.File[], 
    metadata: any, 
    commitMessage?: string
  ): Promise<ModelVersion> {
    // Get the model with latest version
    const model = await this.prisma.model.findUnique({
      where: { id: modelId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!model) {
      throw new Error('Model not found');
    }

    const latestVersion = model.versions[0];
    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Upload to storage
    const { filecoinCid, metadataCid, hash, sizeBytes } = await this.storageService.uploadModelDirectory(modelFiles, {
      ...metadata,
      _uniqueId: `initial_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    });
    
    // Register on blockchain (mock)
    const txHash = await this.blockchainService.registerModelVersion(
      filecoinCid, 
      latestVersion?.filecoinCid || null, 
      metadataCid, 
      hash
    );

    // Create version in database
    const version = await this.prisma.modelVersion.create({
      data: {
        modelId: modelId,
        versionNumber: newVersionNumber,
        filecoinCid,
        metadataCid,
        hash,
        parentVersionId: latestVersion?.id || null,
        commitMessage,
        txHash,
        sizeBytes,
        parameters: metadata.parameters || null
      }
    });

    // Create records for each individual file
    for (const file of modelFiles) {
      const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
      
      await this.prisma.modelFile.create({
        data: {
          modelId,
          versionId: version.id,
          filename: file.originalname,
          path: file.originalname, // might need to parse path from filename
          sizeBytes: file.size,
          mimeType: file.mimetype,
          hash: fileHash
        }
      });
    }

    // Update the model's latestVersionId
    await this.prisma.model.update({
      where: { id: modelId },
      data: { latestVersionId: version.id }
    });

    return version;
  }

  async getVersionHistory(modelId: string): Promise<ModelVersion[]> {
    return this.prisma.modelVersion.findMany({
      where: { modelId },
      orderBy: { versionNumber: 'desc' }
    });
  }

  async getLatestVersion(modelId: string): Promise<ModelVersion | null> {
    return this.prisma.modelVersion.findFirst({
      where: { modelId },
      orderBy: { versionNumber: 'desc' }
    });
  }

  async getVersionById(versionId: string): Promise<ModelVersion | null> {
    return this.prisma.modelVersion.findUnique({
      where: { id: versionId }
    });
  }
}
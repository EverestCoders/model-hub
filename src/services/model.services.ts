// src/services/model.service.ts

import { PrismaClient, Model, ModelVersion } from '@prisma/client';
import { ModelFilter, ModelCreateDto, VersionCreateDto } from '../interfaces/model.interface';
import { StorageService } from './storage.services';
import { VersioningService } from './versioning.services';
import { BlockchainService } from './blockchain.service';

export class ModelService {
  private prisma: PrismaClient;
  private storageService: StorageService;
  private versioningService: VersioningService;
  private blockchainService: BlockchainService;

  constructor(
    prisma: PrismaClient
  ) {
    this.prisma = prisma;
    this.storageService = new StorageService(prisma);
    this.blockchainService = new BlockchainService();
    this.versioningService = new VersioningService(prisma, this.storageService, this.blockchainService);
  }

  async getModels(filter: ModelFilter) {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      category,
      tag,
      license,
      creator
    } = filter;

    const skip = (page - 1) * limit;

    // Build where conditions
    const where: any = {};
    if (category) where.category = category;
    if (license) where.licenseType = license;
    if (creator) where.creatorId = creator;
    
    // Handle tag filtering
    if (tag) {
      where.tags = {
        some: {
          tag
        }
      };
    }

    // Get total count
    const total = await this.prisma.model.count({ where });

    // Get models
    const models = await this.prisma.model.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: order },
      include: {
        creator: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    // Format response
    const formattedModels = models.map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      creatorId: model.creatorId,
      creatorName: model.creator.username,
      createdAt: model.createdAt.toISOString(),
      licenseType: model.licenseType,
      category: model.category,
      downloadCount: model.downloadCount,
      ratingAvg: model.ratingAvg,
      latestVersion: model.versions.length > 0 ? {
        versionNumber: model.versions[0].versionNumber,
        createdAt: model.versions[0].createdAt.toISOString()
      } : null
    }));

    return {
      models: formattedModels,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getModelById(id: string) {
    const model = await this.prisma.model.findUnique({
      where: { id },
      include: {
        creator: true,
        tags: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            modelFiles: true
          }
        },
        ratings: {
          include: {
            user: true
          }
        }
      }
    });

    if (!model) {
      throw new Error('Model not found');
    }

    // Format ratings
    const formattedRatings = model.ratings.map(rating => ({
      rating: rating.rating,
      review: rating.review,
      userId: rating.userId,
      username: rating.user.username,
      createdAt: rating.createdAt.toISOString()
    }));

    // Get latest version details
    const latestVersion = model.versions.length > 0 ? {
      id: model.versions[0].id,
      versionNumber: model.versions[0].versionNumber,
      filecoinCid: model.versions[0].filecoinCid,
      commitMessage: model.versions[0].commitMessage,
      createdAt: model.versions[0].createdAt.toISOString(),
      sizeBytes: model.versions[0].sizeBytes,
      parameters: model.versions[0].parameters,
      files: model.versions[0].modelFiles.map(file => ({
        filename: file.filename,
        path: file.path,
        sizeBytes: file.sizeBytes,
        mimeType: file.mimeType
      }))
    } : null;

    return {
      id: model.id,
      name: model.name,
      description: model.description,
      creator: {
        id: model.creator.id,
        username: model.creator.username,
        walletAddress: model.creator.walletAddress
      },
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
      licenseType: model.licenseType,
      commercialUse: model.commercialUse,
      attributionRequired: model.attributionRequired,
      royaltyPercentage: model.royaltyPercentage,
      category: model.category,
      tags: model.tags.map(tag => tag.tag),
      downloadCount: model.downloadCount,
      ratingAvg: model.ratingAvg,
      latestVersion,
      ratings: formattedRatings
    };
  }

  async createModel(userId: string, modelData: ModelCreateDto) {
    // Create the model in database
    const model = await this.prisma.model.create({
      data: {
        name: modelData.name,
        description: modelData.description || null,
        creatorId: userId,
        licenseType: modelData.licenseType || 'MIT',
        commercialUse: modelData.commercialUse || false,
        attributionRequired: modelData.attributionRequired !== undefined ? modelData.attributionRequired : true,
        royaltyPercentage: modelData.royaltyPercentage || 0,
        category: modelData.category || null,
      }
    });

    // Add tags if provided
    if (modelData.tags) {
      const tagsList = modelData.tags.split(',').map(tag => tag.trim());
      for (const tag of tagsList) {
        await this.prisma.modelTag.create({
          data: {
            modelId: model.id,
            tag
          }
        });
      }
    }

    // Create initial version
    const metadata = {
      parameters: modelData.parameters || null
    };

    const modelFiles = Array.isArray(modelData.modelFile) ? modelData.modelFile : [modelData.modelFile];  
    
    const version = await this.versioningService.createInitialVersion(
      model.id,
      modelFiles,
      metadata,
      'Initial version'
    );

    return {
      id: model.id,
      name: model.name,
      description: model.description,
      version: {
        versionNumber: version.versionNumber,
        filecoinCid: version.filecoinCid,
        id: version.id
      },
      createdAt: model.createdAt.toISOString()
    };
  }

  async createModelVersion(modelId: string, userId: string, versionData: VersionCreateDto) {
    // Check if model exists and user has permission
    const model = await this.prisma.model.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      throw new Error('Model not found');
    }

    if (model.creatorId !== userId) {
      throw new Error('You do not have permission to update this model');
    }

    // Create new version
    const metadata = {
      parameters: versionData.parameters || null
    };

    const modelFiles = Array.isArray(versionData.modelFile) ? versionData.modelFile : [versionData.modelFile];
    
    const version = await this.versioningService.createNewVersion(
      modelId,
      modelFiles,
      metadata,
      versionData.commitMessage
    );

    return {
      modelId,
      version: {
        id: version.id,
        versionNumber: version.versionNumber,
        filecoinCid: version.filecoinCid,
        commitMessage: version.commitMessage,
        createdAt: version.createdAt.toISOString()
      }
    };
  }

  async getModelVersions(modelId: string) {
    // Check if model exists
    const model = await this.prisma.model.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      throw new Error('Model not found');
    }

    // Get all versions
    const versions = await this.prisma.modelVersion.findMany({
      where: { modelId },
      orderBy: { versionNumber: 'desc' }
    });

    // Enhance versions with metadata and storage info
    const enhancedVersions = await Promise.all(versions.map(async version => {
      const metadata = await this.storageService.getMetadata(version.metadataCid);
      const storage = await this.storageService.getStorageDeals(version.filecoinCid);
      
      return {
        id: version.id,
        versionNumber: version.versionNumber,
        filecoinCid: version.filecoinCid,
        metadataCid: version.metadataCid,
        hash: version.hash,
        parentVersionId: version.parentVersionId,
        commitMessage: version.commitMessage,
        createdAt: version.createdAt.toISOString(),
        txHash: version.txHash,
        sizeBytes: version.sizeBytes,
        parameters: version.parameters,
        metadata,
        storage
      };
    }));

    return { versions: enhancedVersions };
  }

  async downloadModel(modelId: string, versionId?: string) {
    // Check if model exists
    const model = await this.prisma.model.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      throw new Error('Model not found');
    }

    // Get version (either specified or latest)
    let version;
    if (versionId) {
      version = await this.prisma.modelVersion.findUnique({
        where: { id: versionId }
      });
      if (!version || version.modelId !== modelId) {
        throw new Error('Version not found for this model');
      }
    } else {
      version = await this.prisma.modelVersion.findFirst({
        where: { modelId },
        orderBy: { versionNumber: 'desc' }
      });
    }

    if (!version) {
      throw new Error('No versions available for this model');
    }

    // Generate download URL
    const downloadUrl = await this.storageService.downloadModel(version.filecoinCid);

    // Increment download count
    await this.prisma.model.update({
      where: { id: modelId },
      data: { downloadCount: { increment: 1 } }
    });

    // Record download
    await this.prisma.download.create({
      data: {
        modelId,
        versionId: version.id,
        // userId would come from authenticated user
      }
    });

    return {
      downloadUrl,
      modelName: model.name,
      version: version.versionNumber,
      filecoinCid: version.filecoinCid
    };
  }

  async rateModel(modelId: string, userId: string, rating: number, review?: string) {
    // Check if model exists
    const model = await this.prisma.model.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      throw new Error('Model not found');
    }

    // Check if user has already rated this model
    const existingRating = await this.prisma.rating.findUnique({
      where: {
        modelId_userId: {
          modelId,
          userId
        }
      }
    });

    if (existingRating) {
      // Update existing rating
      await this.prisma.rating.update({
        where: {
          modelId_userId: {
            modelId,
            userId
          }
        },
        data: {
          rating,
          review
        }
      });
    } else {
      // Create new rating
      await this.prisma.rating.create({
        data: {
          modelId,
          userId,
          rating,
          review
        }
      });
    }

    // Update model's average rating
    const ratings = await this.prisma.rating.findMany({
      where: { modelId }
    });
    
    const ratingSum = ratings.reduce((sum, r) => sum + r.rating, 0);
    const ratingAvg = ratings.length > 0 ? ratingSum / ratings.length : null;
    
    await this.prisma.model.update({
      where: { id: modelId },
      data: { ratingAvg }
    });

    return { success: true };
  }

  
}
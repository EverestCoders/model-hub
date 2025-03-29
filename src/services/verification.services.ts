// src/services/verification.service.ts

import { PrismaClient } from '@prisma/client';
import { StorageService } from './storage.services';
import { BlockchainService } from './blockchain.service';
import { HashService } from './hash.services';
import axios from 'axios';

export class VerificationService {
  private prisma: PrismaClient;
  private storageService: StorageService;
  private blockchainService: BlockchainService;
  private hashService: HashService;

  constructor(
    prisma: PrismaClient
  ) {
    this.prisma = prisma;
    this.storageService = new StorageService(prisma);
    this.blockchainService = new BlockchainService();
    this.hashService = new HashService();
  }

  async verifyModelIntegrity(cid: string, fileUrl: string): Promise<{
    verified: boolean;
    expectedHash: string;
    calculatedHash: string;
  }> {
    try {
      // Get the expected hash from blockchain or database
      const modelVersion = await this.prisma.modelVersion.findFirst({
        where: { filecoinCid: cid }
      });

      if (!modelVersion) {
        throw new Error('Model version not found');
      }

      const expectedHash = modelVersion.hash;

      // Download file from URL
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const fileBuffer = Buffer.from(response.data);

      // Calculate hash
      const calculatedHash = this.hashService.generateFileHash(fileBuffer);

      // Verify with blockchain (mock)
      await this.blockchainService.verifyModelIntegrity(cid, calculatedHash);

      return {
        verified: expectedHash === calculatedHash,
        expectedHash,
        calculatedHash
      };
    } catch (error) {
      console.error('Failed to verify model integrity:', error);
      throw error;
    }
  }

  async verifyModelProvenance(modelCid: string): Promise<{
    modelCid: string;
    modelName: string | null;
    verified: boolean;
    complete: boolean;
    lineage: Array<{
      cid: string;
      creator: string;
      timestamp: number;
      metadataURI: string;
    }>;
  }> {
    try {
      // Get model version from database
      const modelVersion = await this.prisma.modelVersion.findFirst({
        where: { filecoinCid: modelCid },
        include: {
          model: true
        }
      });

      if (!modelVersion) {
        throw new Error('Model version not found');
      }

      // Get blockchain lineage (mock)
      const lineage = await this.blockchainService.getModelHistory(modelCid);

      // Verify each version in lineage (mock)
      const verified = true;
      const complete = true;

      return {
        modelCid,
        modelName: modelVersion.model.name,
        verified,
        complete,
        lineage
      };
    } catch (error) {
      console.error('Failed to verify model provenance:', error);
      throw error;
    }
  }

  async verifyFilecoinStorage(modelCid: string): Promise<{
    modelCid: string;
    blockchainVerified: boolean;
    lighthouseVerified: boolean;
    activeDeals: Array<{
      dealId: number;
      provider: string;
      startTime: number;
      endTime: number;
      status: string;
    }>;
    totalDeals: number;
  }> {
    try {
      // Get model version
      const modelVersion = await this.prisma.modelVersion.findFirst({
        where: { filecoinCid: modelCid }
      });

      if (!modelVersion) {
        throw new Error('Model version not found');
      }

      // Verify on blockchain (mock)
      const blockchainVerified = await this.blockchainService.verifyFilecoinStorage(modelCid);

      // Get storage deals from database
      const storageDeals = await this.prisma.storageDeal.findMany({
        where: { modelVersionId: modelVersion.id }
      });

      // Mock active deals for development
      const activeDeals = storageDeals.map(deal => ({
        dealId: deal.dealId,
        provider: deal.providerId,
        startTime: Math.floor(deal.startTime.getTime() / 1000),
        endTime: Math.floor(deal.endTime.getTime() / 1000),
        status: deal.status
      }));

      // If no deals in database, create mock deals
      if (activeDeals.length === 0) {
        const now = Math.floor(Date.now() / 1000);
        activeDeals.push({
          dealId: 1000,
          provider: 'f01234',
          startTime: now - 86400, // 1 day ago
          endTime: now + 2592000, // 30 days from now
          status: 'active'
        });
      }

      return {
        modelCid,
        blockchainVerified,
        lighthouseVerified: true,
        activeDeals,
        totalDeals: activeDeals.length
      };
    } catch (error) {
      console.error('Failed to verify Filecoin storage:', error);
      throw error;
    }
  }

  async getVerificationReport(modelId: string): Promise<any> {
    try {
      // Get model with latest version
      const model = await this.prisma.model.findUnique({
        where: { id: modelId },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1
          }
        }
      });

      if (!model || model.versions.length === 0) {
        throw new Error('Model or versions not found');
      }

      const latestVersion = model.versions[0];

      // Verify on blockchain (mock)
      const lineageVerified = true;
      const storageVerified = true;

      // Get all versions
      const allVersions = await this.prisma.modelVersion.findMany({
        where: { modelId },
        orderBy: { versionNumber: 'desc' }
      });

      return {
        model: {
          id: model.id,
          name: model.name,
          creatorId: model.creatorId
        },
        latestVersion: {
          id: latestVersion.id,
          versionNumber: latestVersion.versionNumber,
          filecoinCid: latestVersion.filecoinCid
        },
        verification: {
          lineage: {
            verified: lineageVerified
          },
          storage: {
            activeDeals: 3, // Mock value
            verified: storageVerified
          },
          license: {
            creator: model.creatorId,
            licenseType: model.licenseType,
            commercialUse: model.commercialUse,
            attributionRequired: model.attributionRequired,
            royaltyPercentage: model.royaltyPercentage
          }
        },
        versions: allVersions.map(version => ({
          versionNumber: version.versionNumber,
          filecoinCid: version.filecoinCid,
          commitMessage: version.commitMessage,
          createdAt: version.createdAt.toISOString()
        }))
      };
    } catch (error) {
      console.error('Failed to get verification report:', error);
      throw error;
    }
  }
}
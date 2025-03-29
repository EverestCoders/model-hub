// src/controllers/verification.controller.ts

import { Request, Response } from 'express';
import { VerificationService } from '../services/verification.services';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const verificationService = new VerificationService(prisma);

export class VerificationController {
  async verifyIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const { cid, fileUrl } = req.body;
      
      if (!cid || !fileUrl) {
        res.status(400).json({ error: 'CID and fileUrl are required' });
        return;
      }

      const result = await verificationService.verifyModelIntegrity(cid, fileUrl);
      res.json(result);
    } catch (error) {
      console.error('Failed to verify integrity:', error);
      if ((error as Error).message === 'Model version not found') {
        res.status(404).json({ error: 'Model version not found' });
      } else {
        res.status(500).json({ error: 'Failed to verify integrity' });
      }
    }
  }

  async verifyProvenance(req: Request, res: Response): Promise<void> {
    try {
      const { modelCid } = req.params;
      
      if (!modelCid) {
        res.status(400).json({ error: 'Model CID is required' });
        return;
      }

      const result = await verificationService.verifyModelProvenance(modelCid);
      res.json(result);
    } catch (error) {
      console.error('Failed to verify provenance:', error);
      if ((error as Error).message === 'Model version not found') {
        res.status(404).json({ error: 'Model version not found' });
      } else {
        res.status(500).json({ error: 'Failed to verify provenance' });
      }
    }
  }

  async verifyStorage(req: Request, res: Response): Promise<void> {
    try {
      const { modelCid } = req.params;
      
      if (!modelCid) {
        res.status(400).json({ error: 'Model CID is required' });
        return;
      }

      const result = await verificationService.verifyFilecoinStorage(modelCid);
      res.json(result);
    } catch (error) {
      console.error('Failed to verify storage:', error);
      if ((error as Error).message === 'Model version not found') {
        res.status(404).json({ error: 'Model version not found' });
      } else {
        res.status(500).json({ error: 'Failed to verify storage' });
      }
    }
  }

  async getReport(req: Request, res: Response): Promise<void> {
    try {
      const { modelId } = req.params;
      
      if (!modelId) {
        res.status(400).json({ error: 'Model ID is required' });
        return;
      }

      const result = await verificationService.getVerificationReport(modelId);
      res.json(result);
    } catch (error) {
      console.error('Failed to get verification report:', error);
      if ((error as Error).message === 'Model or versions not found') {
        res.status(404).json({ error: 'Model or versions not found' });
      } else {
        res.status(500).json({ error: 'Failed to get verification report' });
      }
    }
  }
}
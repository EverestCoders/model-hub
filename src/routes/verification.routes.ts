// src/routes/verification.routes.ts
import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';

const router = Router();
const verificationController = new VerificationController();

// Verification routes
router.post('/integrity', verificationController.verifyIntegrity.bind(verificationController));
router.get('/provenance/:modelCid', verificationController.verifyProvenance.bind(verificationController));
router.get('/storage/:modelCid', verificationController.verifyStorage.bind(verificationController));
router.get('/report/:modelId', verificationController.getReport.bind(verificationController));

export default router;
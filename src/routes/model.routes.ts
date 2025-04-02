import { Router } from 'express';
import { ModelController } from '../controllers/model.controller';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const modelController = new ModelController();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Public routes
router.get('/', modelController.getModels.bind(modelController));
router.get('/:id', modelController.getModelById.bind(modelController));
router.get('/:id/versions', modelController.getModelVersions.bind(modelController));
router.get('/:id/download/:versionId?', modelController.downloadModel.bind(modelController));

// Protected routes that require authentication
router.post('/', authMiddleware, upload.single('modelFiles'), modelController.createModel.bind(modelController));
router.post('/:id/versions', authMiddleware, upload.single('modelFiles'), modelController.createModelVersion.bind(modelController));
router.post('/:id/rate', authMiddleware, modelController.rateModel.bind(modelController));

export default router;
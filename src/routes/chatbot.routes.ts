import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller'

const router = Router();
const chatbotController = new ChatbotController();

// Process chatbot messages
router.post('/', chatbotController.processMessage.bind(chatbotController));

export default router;
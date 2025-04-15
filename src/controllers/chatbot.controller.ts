import { Request, Response } from 'express';
import { ChatbotService } from '../services/chatbot.service';

const chatbotService = new ChatbotService();

export class ChatbotController {
  async processMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, conversation } = req.body;
      
      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }
      
      const result = await chatbotService.processMessage(message, conversation);
      res.json(result);
    } catch (error) {
      console.error('Error processing chatbot message:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  }
}
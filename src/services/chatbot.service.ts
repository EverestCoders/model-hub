import { PrismaClient, Model, ModelTag, User, ModelVersion } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { serializeBigInt } from '../utils/serialization';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ModelWithRelations extends Model {
  tags: ModelTag[];
  creator: User;
  versions: ModelVersion[];
}

export class ChatbotService {
  private prisma: PrismaClient;
  private genAI: GoogleGenerativeAI;
  private modelName: string = 'gemini-1.5-pro';

  constructor() {
    this.prisma = new PrismaClient();
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  }

  async processMessage(userMessage: string, conversationHistory: Message[] = []): Promise<any> {
    try {
      // Get all models from database for context
      const allModels = await this.prisma.model.findMany({
        include: {
          tags: true,
          creator: true,
          versions: {
            orderBy: {
              versionNumber: 'desc'
            },
            take: 1
          }
        }
      }) as ModelWithRelations[];
      
      // Format models data for Gemini
      const modelsData = allModels.map(model => {
        const latestVersion = model.versions.length > 0 ? model.versions[0] : null;
        
        return {
          id: model.id,
          name: model.name,
          description: model.description,
          category: model.category,
          tags: model.tags.map(tag => tag.tag),
          licenseType: model.licenseType,
          commercialUse: model.commercialUse,
          creator: model.creator.username,
          parameters: latestVersion?.parameters || null,
          sizeBytes: latestVersion?.sizeBytes || null
        };
      });
      
      let userStartIndex = conversationHistory.findIndex(msg => msg.role === 'user');
      const validHistory = userStartIndex !== -1 
        ? conversationHistory.slice(userStartIndex) 
        : [];
        
      const history = validHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const chat = model.startChat({
        history: history.length > 0 ? history : undefined, // Only pass history if it's valid
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40
        }
      });

      const systemPrompt = `
      You are a helpful assistant for the Everest Model Hub, a platform where users can find and download AI models.
      
      Below is the database of models available on our platform:
      ${JSON.stringify(serializeBigInt(modelsData), null, 2)}
      
      Your role is to:
      1. Help users find the most suitable model for their use case
      2. Answer questions about specific models' capabilities
      3. Provide suggestions based on the user's requirements
      4. Explain model types and categories if needed
      
      When suggesting models, always provide the model ID and name, and briefly explain why it's a good fit.
      Important: When you recommend specific models, include their IDs in square brackets, e.g. [${modelsData[0]?.id}].
      
      Now, respond to the user's message:
      ${userMessage}
      `;
      
      const result = await chat.sendMessage(systemPrompt);
      const response = result.response.text();
      
      const modelIdRegex = /\[([\w-]+)\]/g;
      const matches = [...response.matchAll(modelIdRegex)];
      const suggestedModelIds = matches.map(match => match[1]);
      
      const suggestedModels = suggestedModelIds.length > 0 ? 
        await this.prisma.model.findMany({
          where: {
            id: {
              in: suggestedModelIds
            }
          },
          select: {
            id: true,
            name: true
          }
        }) : [];
      
        const modelMap = new Map(suggestedModels.map(model => [model.id, model.name]));

        let processedResponse = response;
        for (const [modelId, modelName] of modelMap.entries()) {
          processedResponse = processedResponse.replace(
            new RegExp(`\\[${modelId}\\]`, 'g'), 
            `<strong class="text-blue-600">${modelName}</strong>`
          );
        }
        
        if (processedResponse.length > 150) {
          const sentenceEndRegex = /[.!?]\s+/g;
          let match;
          let sentenceCount = 0;
          let truncationIndex = 150;
          
          while ((match = sentenceEndRegex.exec(processedResponse)) !== null) {
            sentenceCount++;
            if (sentenceCount === 2) {
              truncationIndex = match.index + 1; 
              break;
            }
          }
          
          processedResponse = processedResponse.substring(0, truncationIndex);
        }
        
        return {
          response: processedResponse,
          suggestedModels
        };
    } catch (error) {
      console.error('Error processing with Gemini:', error);
      throw error;
    }
  }
}
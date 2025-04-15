import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { SendIcon, XIcon, BotIcon, UserIcon } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestedModels?: Array<{
    id: string;
    name: string;
  }>;
}

interface ChatbotProps {
  onSelectModel: (modelId: string) => void;
}

const API_BASE_URL = 'http://localhost:3002';

const ModelChatbot: React.FC<ChatbotProps> = ({ onSelectModel }: any) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hi! I can help you find the right model for your use case. What kind of task are you trying to solve?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleModelNameClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Check if the clicked element is a model name
    if (target.tagName === 'STRONG' && target.classList.contains('text-blue-600')) {
      const modelName = target.textContent;
      
      // Find the model ID from suggestedModels
      const selectedModel = messages
        .filter(msg => msg.role === 'assistant')
        .flatMap(msg => msg.suggestedModels || [])
        .find(model => model.name === modelName);
        
      if (selectedModel) {
        onSelectModel(selectedModel.id);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversation: messages
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        suggestedModels: data.suggestedModels
      }]);
      
      if (data.suggestedModels && data.suggestedModels.length > 0) {
        console.log('Suggested models:', data.suggestedModels);
      }
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isOpen ? (
        <Card className="w-80 md:w-96 h-150 flex flex-col shadow-lg border-2 border-blue-200">
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
            <div className="flex items-center">
              <BotIcon className="mr-2 h-5 w-5" />
              <span className="font-medium">Model Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700 p-1 h-8 w-8"
              onClick={toggleChat}
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'assistant' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'assistant'
                      ? 'bg-white border border-gray-200'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <BotIcon className="h-5 w-5 mt-1 flex-shrink-0" />
                    )}
                    <div className="text-sm"
                      onClick={message.role === 'assistant' ? handleModelNameClick : undefined}
                      >
                      {message.role === 'assistant' ? (
                        <div dangerouslySetInnerHTML={{ __html: message.content }} />
                      ) : (
                        message.content
                      )}
                    </div>
                    {message.role === 'user' && (
                      <UserIcon className="h-5 w-5 mt-1 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 border-t">
            <div className="flex items-center">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                className="ml-2 h-9 w-9 p-0"
                disabled={isLoading || !input.trim()}
                onClick={handleSend}
              >
                <SendIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button
          className="rounded-full h-14 w-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
          onClick={toggleChat}
        >
          <BotIcon className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default ModelChatbot;
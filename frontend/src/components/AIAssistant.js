import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles, X, Check, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AIAssistant = ({ 
  contextType = 'ticket_create', 
  contextData = {}, 
  onAutoFill = null,
  onClose = null,
  isOpen = true,
  title = "Asistent AI"
}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedFields, setSuggestedFields] = useState({});
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('fixgsm_token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with context-specific welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = getWelcomeMessage(contextType, contextData);
      setMessages([{
        id: Date.now(),
        type: 'ai',
        content: welcomeMessage,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [isOpen, contextType, contextData]);

  const getWelcomeMessage = (type, data) => {
    switch (type) {
      case 'ticket_create':
        return `🤖 Bună! Sunt asistentul AI pentru crearea fișelor de reparație.

Pentru a te ajuta să completezi fișa rapid și precis, descrie-mi:
• Ce dispozitiv este (model, brand)
• Ce problemă raportează clientul
• Simptomele observate

Voi genera automat toate câmpurile necesare!`;

      case 'ticket_diagnose':
        return `🔧 Asistent diagnostic activat!

Am acces la toate detaliile fișei:
• Dispozitiv: ${data.device_model || 'N/A'}
• Problema: ${data.reported_issue || 'N/A'}
• Status: ${data.status || 'N/A'}

Întreabă-mă orice despre diagnostic, soluții sau pași următori!`;

      case 'parts_order':
        return `📦 Asistent comenzi piese activat!

Pot să te ajut cu:
• Căutare piese pentru dispozitive specifice
• Comparare prețuri și calități
• Generare liste de comandă
• Tracking comenzi existente

Ce piese ai nevoie?`;

      default:
        return `🤖 Bună! Sunt asistentul AI FixGSM. Cu ce te pot ajuta?`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/ai/chat-with-context`, {
        message: inputMessage,
        context_type: contextType,
        context_data: contextData
      }, config);

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.response || 'Îmi pare rău, nu am putut procesa cererea.',
        timestamp: new Date().toISOString(),
        structured_data: response.data.structured_data || null
      };

      setMessages(prev => [...prev, aiMessage]);

      // Handle structured data for auto-fill
      if (response.data.structured_data && onAutoFill) {
        setSuggestedFields(response.data.structured_data);
        toast.success('Sugestii generate! Verifică câmpurile completate.');
      }

    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Îmi pare rău, am întâmpinat o problemă. Te rog să încerci din nou.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Eroare la comunicarea cu AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const applySuggestion = (field, value) => {
    if (onAutoFill) {
      onAutoFill(field, value);
      toast.success(`Câmpul ${field} a fost completat!`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiat în clipboard!');
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-700 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full h-full bg-slate-900/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            {title}
          </CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-blue-500' 
                    : 'bg-purple-500'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                
                <div className={`rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-100'
                }`}>
                  <div 
                    className="text-sm"
                    dangerouslySetInnerHTML={{ 
                      __html: formatMessage(message.content) 
                    }}
                  />
                  
                  {message.structured_data && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-slate-300 mb-2">Sugestii generate:</div>
                      {Object.entries(message.structured_data).map(([field, value]) => (
                        <div key={field} className="flex items-center gap-2 bg-slate-700/50 rounded p-2">
                          <Badge variant="outline" className="text-xs">
                            {field}
                          </Badge>
                          <span className="text-xs flex-1">{value}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => applySuggestion(field, value)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(value)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-3">
                <Bot className="w-4 h-4 text-purple-400" />
                <div className="flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-sm text-slate-300">AI scrie...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Scrie mesajul tău..."
            className="flex-1 bg-slate-800/50 border-slate-700 text-white"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistant;

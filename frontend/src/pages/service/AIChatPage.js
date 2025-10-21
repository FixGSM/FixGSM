import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Bot, User, ArrowLeft, Paperclip, Clock, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AIChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(localStorage.getItem('fixgsm_ai_conversation_id') || null);
  const [showHistory, setShowHistory] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('fixgsm_token');
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations list
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API}/ai/conversations`, { headers: authHeaders });
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Check AI status and plan limits
  const [planLimits, setPlanLimits] = useState(null);
  
  const checkAIStatus = async () => {
    try {
      // Check AI configuration
      const res = await fetch(`${API}/ai/config`, { headers: authHeaders });
      if (!res.ok) return;
      const config = await res.json();
      setAiEnabled(config.enabled);
      
      // Check subscription plan limits
      const subRes = await fetch(`${API}/tenant/subscription-status`, { headers: authHeaders });
      if (subRes.ok) {
        const subData = await subRes.json();
        setPlanLimits(subData.plan_limits);
      }
    } catch (e) {
      console.error('Could not check AI status:', e);
    }
  };

  // Load messages for selected conversation
  const loadConversation = async (id) => {
    try {
      if (!id) return;
      const res = await fetch(`${API}/ai/conversations/${id}`, { headers: authHeaders });
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      const loaded = (data.messages || []).map((m, idx) => ({
        id: `${m.timestamp}-${idx}`,
        type: m.type,
        content: m.content,
        timestamp: m.timestamp
      }));
      setMessages(loaded);
    } catch (e) {
      console.error(e);
      toast.error('Nu am putut încărca conversația');
    }
  };

  // On first load, fetch conversations and check AI status
  useEffect(() => {
    fetchConversations();
    checkAIStatus();
  }, []);

  // Load messages whenever conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  // Create new conversation
  const startNewConversation = async () => {
    try {
      const res = await fetch(`${API}/ai/conversations`, { method: 'POST', headers: authHeaders });
      if (!res.ok) throw new Error('Failed to create conversation');
      const data = await res.json();
      const newId = data.conversation_id;
      setConversationId(newId);
      localStorage.setItem('fixgsm_ai_conversation_id', newId);
      setMessages([]);
      fetchConversations();
      toast.success('Conversație nouă creată');
    } catch (e) {
      console.error(e);
      toast.error('Nu am putut crea conversația');
    }
  };

  const selectConversation = async (id) => {
    setShowHistory(false);
    setConversationId(id);
    localStorage.setItem('fixgsm_ai_conversation_id', id);
    await loadConversation(id);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulează delay-ul de typing AI (2-5 secunde)
    const typingDelay = Math.random() * 3000 + 2000; // 2-5 secunde
    await new Promise(resolve => setTimeout(resolve, typingDelay));

    try {
      const response = await fetch(`${API}/ai/chat`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          message: userMessage.content,
          conversation_history: messages,
          conversation_id: conversationId || null
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.detail && errorData.detail.includes('disabled')) {
            throw new Error('AI_DISABLED');
          }
          if (errorData.detail && (errorData.detail.includes('Trial') || errorData.detail.includes('Basic') || errorData.detail.includes('Upgrade'))) {
            throw new Error('AI_NOT_AVAILABLE_IN_PLAN');
          }
        }
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Persist returned conversation_id
      if (data.conversation_id && data.conversation_id !== conversationId) {
        setConversationId(data.conversation_id);
        localStorage.setItem('fixgsm_ai_conversation_id', data.conversation_id);
        fetchConversations();
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: (data.memorized ? '🧠 [Memorizat] ' : '') + (data.response || 'Îmi pare rău, nu am putut procesa cererea ta.'),
        timestamp: data.timestamp || new Date().toISOString()
      };

      if (data.memorized) {
        toast.success('Cunoștință memorată pentru viitor');
      }

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      let fallbackContent = 'Îmi pare rău, momentan nu sunt disponibil. Te rog încearcă din nou mai târziu.';
      let errorToastMessage = 'Eroare la comunicarea cu AI-ul';
      
      if (error.message === 'AI_DISABLED') {
        fallbackContent = '⚠️ AI Assistant-ul este momentan dezactivat pentru organizația ta.\n\nAdministratorul poate să-l activeze din: Setări → Configurare AI';
        errorToastMessage = 'AI Assistant dezactivat';
      } else if (error.message === 'AI_NOT_AVAILABLE_IN_PLAN') {
        fallbackContent = '🔒 AI Assistant nu este disponibil în planul tău curent (Trial/Basic).\n\n✨ Upgrade la planul Pro sau Enterprise pentru acces la AI Assistant!\n\nMergi la: Setări → Abonament → Upgrade';
        errorToastMessage = 'AI Assistant disponibil doar în planul Pro/Enterprise';
      }
      
      toast.error(errorToastMessage);
      const fallbackMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: fallbackContent,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMessage]);
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

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-6 flex-shrink-0">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10 rounded-xl" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Înapoi
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 rounded-xl"
              title="Conversație nouă"
              onClick={startNewConversation}
            >
              <PencilLine className="w-4 h-4 mr-2" /> New Chat
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10 rounded-xl"
                title="Istoric conversații"
                onClick={() => {
                  setShowHistory((s) => !s);
                  if (!conversations.length) fetchConversations();
                }}
              >
                <Clock className="w-4 h-4 mr-2" /> History
              </Button>

              {showHistory && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-10 max-h-80 overflow-auto">
                  {conversations.length === 0 && (
                    <div className="px-4 py-3 text-slate-400 text-sm">Nu există conversații</div>
                  )}
                  {conversations.map((c) => (
                    <div key={c.conversation_id} className={`flex items-start gap-2 px-4 py-3 ${conversationId === c.conversation_id ? 'bg-white/5' : ''} hover:bg-white/5`}>
                      <button
                        onClick={() => selectConversation(c.conversation_id)}
                        className="flex-1 text-left"
                      >
                        <div className="text-white text-sm truncate">{c.title || 'Conversație'}</div>
                        {c.last_message_preview && (
                          <div className="text-slate-400 text-xs truncate">{c.last_message_preview}</div>
                        )}
                      </button>
                      <Button
                        variant="ghost"
                        className="text-slate-300 hover:text-red-400 hover:bg-red-500/10 px-2 py-1"
                        title="Șterge conversația"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await fetch(`${API}/ai/conversations/${c.conversation_id}`, { method: 'DELETE', headers: authHeaders });
                            if (!res.ok) throw new Error('Delete failed');
                            if (conversationId === c.conversation_id) {
                              setConversationId(null);
                              localStorage.removeItem('fixgsm_ai_conversation_id');
                              setMessages([]);
                            }
                            fetchConversations();
                            toast.success('Conversație ștearsă');
                          } catch (err) {
                            console.error(err);
                            toast.error('Nu am putut șterge conversația');
                          }
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Status Warning Banner */}
        {!aiEnabled && (
          <div className="mx-6 mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-start gap-3">
            <div className="text-orange-400 mt-0.5">⚠️</div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm mb-1">AI Assistant Dezactivat</h3>
              <p className="text-slate-300 text-sm">
                AI Assistant-ul este momentan dezactivat pentru organizația ta. 
                Administratorul poate să-l activeze din <span className="font-semibold text-orange-400">Setări → Configurare AI</span>.
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-orange-400 hover:bg-orange-500/10 px-3"
              onClick={() => navigate('/settings')}
            >
              Setări
            </Button>
          </div>
        )}

        {/* Plan Limit Warning Banner - AI not available in Trial/Basic */}
        {aiEnabled && planLimits && !planLimits.has_ai && (
          <div className="mx-6 mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
            <div className="text-amber-400 mt-0.5">⚠️</div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm mb-1">AI Assistant Indisponibil</h3>
              <p className="text-slate-300 text-sm">
                AI Assistant nu este disponibil în planul tău curent (Trial/Basic). 
                Fă upgrade la <span className="font-semibold text-amber-400">Pro</span> sau <span className="font-semibold text-amber-400">Enterprise</span> pentru acces la AI.
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-amber-400 hover:bg-amber-500/10 px-3"
              onClick={() => navigate('/settings?tab=subscription')}
            >
              Upgrade
            </Button>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-start pt-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-violet-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Bun venit la AI Assistant!</h2>
              <p className="text-slate-400 max-w-md">
                Poți să mă întrebi orice despre service GSM, fișe, clienți sau diagnosticare.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-3xl">
                  {message.type === 'user' ? (
                    <div className="text-right">
                      <div className="inline-block bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl px-6 py-4 border border-cyan-500/30">
                        <p className="text-white leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs text-cyan-400 mt-2">
                          {new Date(message.timestamp).toLocaleTimeString('ro-RO', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-left">
                      <div className="text-white leading-relaxed whitespace-pre-wrap mb-2">{message.content}</div>
                      <div className="text-xs text-violet-400">
                        {new Date(message.timestamp).toLocaleTimeString('ro-RO', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-3xl">
                <div className="text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-violet-400 text-sm font-medium">AI scrie...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - fixat la marginea de jos */}
        <div className="px-6 pb-6 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/20 p-4 flex items-end gap-3 transition-all duration-300 focus-within:border-violet-500/60 focus-within:bg-slate-700/70 relative overflow-hidden group">
                {/* Animated light effect - doar lumina se mișcă */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                  {/* Lumina care se mișcă de la stânga la dreapta */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <div className="absolute inset-y-0 w-full bg-gradient-to-r from-transparent via-violet-400/30 to-transparent transform -translate-x-full group-focus-within:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                  </div>
                  {/* Shadow fix care se intensifică */}
                  <div className="absolute inset-0 rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.2)] group-focus-within:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-500"></div>
                </div>
                <div className="relative z-10 w-full flex items-end gap-3">
                  <Button
                    onClick={() => toast.info('Funcția de attach fișiere va fi disponibilă în curând')}
                    disabled={false}
                    className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 shadow-lg shadow-slate-500/25 transition-all duration-200 hover:scale-105 flex-shrink-0"
                    title="Atașează fișiere"
                  >
                    <Paperclip className="w-5 h-5 text-white" />
                  </Button>
                  <div className="flex-1">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={aiEnabled ? "Scrie mesajul tău pentru AI..." : "AI dezactivat - contactează administratorul"}
                      className="w-full bg-transparent text-white placeholder-slate-400 resize-none border-none outline-none min-h-[60px] max-h-32 focus:ring-0 focus:outline-none"
                      rows={2}
                      disabled={isLoading || !aiEnabled}
                    />
                    <div className="text-xs text-slate-500 mt-2 text-center">
                      AI-ul poate face greșeli. Verifică informațiile importante.
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading || !aiEnabled}
                    className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIChatPage;

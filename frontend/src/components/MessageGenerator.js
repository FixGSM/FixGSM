import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Copy, Check, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MessageGenerator = ({ isOpen, onClose, ticketData = {} }) => {
  const [messageType, setMessageType] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem('fixgsm_token');
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const messageTypes = [
    {
      value: 'status_update',
      label: 'Actualizare Status',
      description: 'Notificare client despre schimbarea statusului fișei',
      icon: '📊'
    },
    {
      value: 'cost_estimate',
      label: 'Estimare Cost',
      description: 'Mesaj cu costul estimat al reparației',
      icon: '💰'
    },
    {
      value: 'completion_notification',
      label: 'Finalizare Reparație',
      description: 'Notificare că reparația este gata',
      icon: '✅'
    },
    {
      value: 'delay_notification',
      label: 'Notificare Întârziere',
      description: 'Informare client despre întârziere',
      icon: '⏰'
    },
    {
      value: 'custom',
      label: 'Mesaj Personalizat',
      description: 'Mesaj personalizat conform contextului specificat',
      icon: '✏️'
    }
  ];

  const handleGenerateMessage = async () => {
    if (!messageType) {
      toast.error('Selectează tipul de mesaj');
      return;
    }

    setIsGenerating(true);
    setGeneratedMessage('');

    try {
      const response = await axios.post(`${API}/ai/generate-message`, {
        message_type: messageType,
        ticket_data: ticketData,
        custom_context: customContext
      }, { headers: authHeaders });

      const data = response.data;
      setGeneratedMessage(data.message);
      toast.success('Mesaj generat cu succes!');

    } catch (error) {
      console.error('Error generating message:', error);
      toast.error(error.response?.data?.detail || 'Eroare la generarea mesajului');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      toast.success('Mesaj copiat în clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Eroare la copierea mesajului');
    }
  };

  const handleSendMessage = () => {
    if (!ticketData?.client_phone) {
      toast.error('Numărul de telefon al clientului nu este disponibil');
      return;
    }

    // Format phone number for WhatsApp
    const cleanPhone = ticketData.client_phone.replace(/\D/g, '');
    const whatsappPhone = cleanPhone.startsWith('0') ? `40${cleanPhone.substring(1)}` : cleanPhone;
    
    // Create WhatsApp URL with pre-filled message
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(generatedMessage)}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    toast.success('WhatsApp deschis cu mesajul pre-completat!');
    onClose();
  };

  const resetForm = () => {
    setMessageType('');
    setCustomContext('');
    setGeneratedMessage('');
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getSelectedMessageType = () => {
    return messageTypes.find(type => type.value === messageType);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-effect border border-white/10 text-white max-w-4xl h-[90vh] flex flex-col rounded-3xl p-0">
        <DialogHeader className="p-6 pb-4 border-b border-slate-700">
          <DialogTitle className="text-2xl font-bold gradient-text font-['Space_Grotesk'] flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-purple-400" />
            Generator Mesaje Client
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Ticket Info */}
          {ticketData && Object.keys(ticketData).length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-slate-200 mb-3">Informații Fișă</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Client:</span>
                  <span className="text-white ml-2">{ticketData.client_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Dispozitiv:</span>
                  <span className="text-white ml-2">{ticketData.device_model || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Fișa:</span>
                  <span className="text-white ml-2">{ticketData.ticket_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <span className="text-white ml-2">{ticketData.status || 'N/A'}</span>
                </div>
                {ticketData.estimated_cost && (
                  <div>
                    <span className="text-slate-400">Cost estimat:</span>
                    <span className="text-white ml-2">{ticketData.estimated_cost} RON</span>
                  </div>
                )}
                {ticketData.client_phone && (
                  <div className="col-span-2">
                    <span className="text-slate-400">Telefon:</span>
                    <span className="text-green-400 ml-2 font-mono">{ticketData.client_phone}</span>
                    <span className="text-green-300 text-xs ml-2">✓ WhatsApp disponibil</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message Type Selection */}
          <div className="space-y-4">
            <Label className="text-slate-300 text-lg">Tipul de mesaj</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {messageTypes.map((type) => (
                <div
                  key={type.value}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    messageType === type.value
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                  onClick={() => setMessageType(type.value)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white">{type.label}</h4>
                      <p className="text-sm text-slate-400">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Context */}
          {messageType && (
            <div className="space-y-3">
              <Label className="text-slate-300">
                Context suplimentar {messageType === 'custom' && '(obligatoriu)'}
              </Label>
              <Textarea
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder={
                  messageType === 'custom' 
                    ? 'Descrie contextul specific pentru mesajul personalizat...'
                    : 'Detalii suplimentare pentru mesaj (opțional)...'
                }
                className="bg-slate-800/50 border-slate-700 text-white rounded-xl min-h-[100px] focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>
          )}

          {/* Generate Button */}
          {messageType && (
            <Button
              onClick={handleGenerateMessage}
              disabled={isGenerating || (messageType === 'custom' && !customContext.trim())}
              className="w-full h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generez mesajul...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generează mesaj AI
                </>
              )}
            </Button>
          )}

          {/* Generated Message */}
          {generatedMessage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-lg">Mesaj generat</Label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyMessage}
                    className="bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white"
                  >
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? 'Copiat!' : 'Copiază'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={!ticketData?.client_phone}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Trimite pe WhatsApp
                  </Button>
                  {!ticketData?.client_phone && (
                    <p className="text-slate-400 text-xs mt-1">
                      ⚠️ Numărul de telefon nu este disponibil pentru această fișă
                    </p>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center space-x-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                    {getSelectedMessageType()?.label}
                  </Badge>
                </div>
                <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {generatedMessage}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose} className="bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white">
            Anulează
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageGenerator;

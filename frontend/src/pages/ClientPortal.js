import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, ArrowLeft, Search, Calendar, MapPin, User, Phone, QrCode, FileText, Clock, Shield, Zap, Users, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [formData, setFormData] = useState({
    ticket_number: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/client-portal/check-status`, formData);
      setTicket(response.data);
      toast.success('Fișă găsită!');
    } catch (error) {
      console.error('Check status error:', error);
      toast.error(error.response?.data?.detail || 'Fișa nu a fost găsită sau numărul de telefon nu corespunde');
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('receptionat') || lowerStatus.includes('garantie')) {
      return 'bg-blue-500';
    } else if (lowerStatus.includes('reparatie') || lowerStatus.includes('verificare') || lowerStatus.includes('laborator')) {
      return 'bg-cyan-500';
    } else if (lowerStatus.includes('asteptare') || lowerStatus.includes('piesa') || lowerStatus.includes('presa')) {
      return 'bg-amber-500';
    } else if (lowerStatus.includes('gata') || lowerStatus.includes('finalizat')) {
      return 'bg-green-500';
    } else if (lowerStatus.includes('refuz')) {
      return 'bg-red-500';
    }
    return 'bg-slate-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />

      {/* Navigation */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[96%] max-w-7xl z-50">
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 flex justify-between items-center shadow-2xl shadow-black/20">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl px-4 py-2 transition-all duration-300"
              onClick={() => navigate('/')}
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Înapoi
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">FixGSM</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-6 pt-40 pb-20">
        <div className="w-full max-w-md">
          
          {/* Centered Search Form */}
          <div className="animate-fade-in">
            <div className="glass-effect rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
              
              {/* Animated Light Effect */}
              <div className="absolute inset-0 rounded-3xl opacity-30">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-400/10 via-transparent to-blue-400/10 rounded-3xl animate-spin" style={{ animationDuration: '8s' }}></div>
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-purple-400/10 via-transparent to-cyan-400/10 rounded-3xl animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}></div>
              </div>

              {/* Glowing Border Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-sm animate-pulse"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25">
                    <Search className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Verifică Status Reparație</h2>
                  <p className="text-slate-400">Introdu ID-ul fișei de service</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" data-testid="search-form">
                  <div className="space-y-2">
                    <Label htmlFor="ticket_number" className="text-slate-300 font-medium">ID Fișă Service</Label>
                    <div className="relative">
                      {/* Animated light ring around input */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl opacity-75 blur-sm animate-pulse"></div>
                      <div className="relative bg-slate-800/50 rounded-xl p-1">
                        <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-20" />
                        <Input
                          id="ticket_number"
                          name="ticket_number"
                          value={formData.ticket_number}
                          onChange={handleChange}
                          required
                          className="pl-10 bg-transparent border-0 text-white rounded-xl h-12 focus:ring-0 focus:outline-none text-center placeholder:text-slate-500"
                          data-testid="ticket-number-input"
                          placeholder="ex: BMP268"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl h-12 text-base font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 relative overflow-hidden"
                    disabled={loading}
                    data-testid="search-btn"
                  >
                    {/* Button light effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Se caută...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Verifică
                        </>
                      )}
                    </div>
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Details */}
      {ticket && (
        <div className="w-full max-w-6xl mx-auto px-6 mt-12">
          <div className="glass-effect rounded-3xl p-8 border border-white/10 shadow-2xl" data-testid="ticket-details">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Detalii Reparație</h2>
                  <p className="text-slate-400">Informații complete despre fișa de service</p>
                </div>
              </div>
              <Badge className={`${getStatusColor(ticket.status)} text-white px-6 py-3 text-base font-semibold rounded-xl`} data-testid="ticket-status">
                {ticket.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="glass-effect rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <User className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-400 font-medium">Client</span>
                </div>
                <p className="text-white text-lg font-semibold" data-testid="client-name">{ticket.client_name}</p>
              </div>

              <div className="glass-effect rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Phone className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-400 font-medium">Telefon</span>
                </div>
                <p className="text-white text-lg font-semibold" data-testid="client-phone">{ticket.client_phone}</p>
              </div>

              <div className="glass-effect rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-400 font-medium">Dispozitiv</span>
                </div>
                <p className="text-white text-lg font-semibold" data-testid="device-model">{ticket.device_model}</p>
              </div>

              <div className="glass-effect rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-400 font-medium">Data Recepționare</span>
                </div>
                <p className="text-white text-lg font-semibold" data-testid="created-at">
                  {new Date(ticket.created_at).toLocaleDateString('ro-RO')}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-effect rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-400 font-medium">Problema Rapotată</span>
                </div>
                <p className="text-white leading-relaxed" data-testid="reported-issue">
                  {ticket.reported_issue}
                </p>
              </div>

              {ticket.service_operations && (
                <div className="glass-effect rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <span className="text-slate-400 font-medium">Operațiuni Service</span>
                  </div>
                  <p className="text-white leading-relaxed" data-testid="service-operations">
                    {ticket.service_operations}
                  </p>
                </div>
              )}

              {ticket.estimated_cost > 0 && (
                <div className="glass-effect rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <span className="text-slate-400 font-medium">Cost Estimat</span>
                  </div>
                  <p className="text-3xl font-bold gradient-text" data-testid="estimated-cost">
                    {ticket.estimated_cost} LEI
                  </p>
                </div>
              )}

              {ticket.observations && (
                <div className="glass-effect rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span className="text-slate-400 font-medium">Observații</span>
                  </div>
                  <p className="text-white leading-relaxed" data-testid="observations">
                    {ticket.observations}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;

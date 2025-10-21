import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, ArrowLeft, CheckCircle2, Loader2, User, Mail, Lock, Building, Hash, Phone, MapPin, Briefcase, Shield, Zap, Users, Star } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    owner_name: '',
    company_name: '',
    cui: '',
    service_name: '',
    address: '',
    phone: '',
    email: '',
    password: ''
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
      const response = await axios.post(`${API}/auth/register-service`, formData);
      setSuccess(true);
      toast.success('Înregistrare reușită! Contul tău așteaptă aprobarea administratorului.');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Eroare la înregistrare');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />

        {/* Navigation */}
        <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[96%] max-w-7xl z-50">
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 flex justify-between items-center shadow-2xl shadow-black/20">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold gradient-text">FixGSM</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Success Content */}
        <div className="flex items-center justify-center min-h-screen px-6 pt-40 pb-20">
          <div className="w-full max-w-md">
            <div className="glass-effect rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden" data-testid="success-card">
              
              {/* Animated Light Effect */}
              <div className="absolute inset-0 rounded-3xl opacity-30">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-cyan-500/20 rounded-3xl animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-400/10 via-transparent to-emerald-400/10 rounded-3xl animate-spin" style={{ animationDuration: '8s' }}></div>
              </div>

              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Înregistrare Reușită!</h2>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  Contul tău a fost creat cu succes. Vei primi un email când administratorul va aproba înregistrarea.
                </p>
                <Button
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl h-12 text-base font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25"
                  onClick={() => navigate('/login')}
                  data-testid="go-to-login-btn"
                >
                  Mergi la Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="w-full max-w-4xl">
          
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <h1 className="text-5xl font-bold mb-6">
              <span className="gradient-text">Înregistrează Service-ul Tău</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Alătură-te platformei FixGSM și transformă modul în care gestionezi service-ul de reparații GSM
            </p>
          </div>

          {/* Form */}
          <div className="glass-effect rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden" data-testid="onboarding-form">
            
            {/* Animated Light Effect */}
            <div className="absolute inset-0 rounded-3xl opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-400/5 via-transparent to-blue-400/5 rounded-3xl animate-spin" style={{ animationDuration: '10s' }}></div>
            </div>

            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Completează Informațiile</h2>
                <p className="text-slate-400">Vei primi acces după aprobarea administratorului</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Personal Info */}
                <div className="glass-effect rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Informații Personale</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="owner_name" className="text-slate-300 font-medium">Nume și Prenume *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="owner_name"
                          name="owner_name"
                          value={formData.owner_name}
                          onChange={handleChange}
                          required
                          className="pl-10 bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 focus:border-cyan-500 focus:ring-cyan-500/20"
                          data-testid="owner-name-input"
                          placeholder="ex: Ion Popescu"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300 font-medium">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="pl-10 bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 focus:border-cyan-500 focus:ring-cyan-500/20"
                          data-testid="email-input"
                          placeholder="ex: ion@service.ro"
                          autoComplete="username"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <Label htmlFor="password" className="text-slate-300 font-medium">Parolă *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 focus:border-cyan-500 focus:ring-cyan-500/20"
                        data-testid="password-input"
                        placeholder="Minim 6 caractere"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                <div className="glass-effect rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Building className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Informații Firmă</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company_name" className="text-slate-300 font-medium">Nume Firmă *</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="company_name"
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleChange}
                          required
                          className="pl-10 bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 focus:border-cyan-500 focus:ring-cyan-500/20"
                          data-testid="company-name-input"
                          placeholder="ex: Service GSM SRL"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cui" className="text-slate-300 font-medium">CUI *</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="cui"
                          name="cui"
                          value={formData.cui}
                          onChange={handleChange}
                          required
                          className="pl-10 bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 focus:border-cyan-500 focus:ring-cyan-500/20"
                          data-testid="cui-input"
                          placeholder="ex: RO12345678"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Info */}
                <div className="glass-effect rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Informații Service</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="service_name" className="text-slate-300 font-medium">Nume Service *</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="service_name"
                          name="service_name"
                          value={formData.service_name}
                          onChange={handleChange}
                          required
                          className="pl-10 bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 focus:border-cyan-500 focus:ring-cyan-500/20"
                          data-testid="service-name-input"
                          placeholder="ex: FixGSM Center"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-300 font-medium">Telefon *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="pl-10 bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 focus:border-cyan-500 focus:ring-cyan-500/20"
                          data-testid="phone-input"
                          placeholder="ex: 0712345678"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <Label htmlFor="address" className="text-slate-300 font-medium">Adresă *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        className="pl-10 bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 focus:border-cyan-500 focus:ring-cyan-500/20"
                        data-testid="address-input"
                        placeholder="ex: Str. Principală nr. 1, București"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl h-12 text-base font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 relative overflow-hidden"
                  disabled={loading}
                  data-testid="submit-btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center justify-center">
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Se înregistrează...
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-5 h-5 mr-2" />
                        Înregistrează Service-ul
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
  );
};

export default OnboardingPage;

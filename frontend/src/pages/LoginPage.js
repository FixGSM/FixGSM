import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, ArrowLeft, Loader2, Mail, Lock, Eye, EyeOff, Shield, Zap, Users, Star } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
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
      const response = await axios.post(`${API}/auth/login`, formData);
      const { token, user_type, tenant_id, user_id, name, role } = response.data;

      // Store auth data
      localStorage.setItem('fixgsm_token', token);
      localStorage.setItem('fixgsm_user_type', user_type);
      localStorage.setItem('fixgsm_user_id', user_id);
      localStorage.setItem('fixgsm_name', name);
      
      if (tenant_id) {
        localStorage.setItem('fixgsm_tenant_id', tenant_id);
      }
      
      if (role) {
        localStorage.setItem('fixgsm_role', role);
      }

      toast.success(`Bun venit, ${name}!`);

      // Redirect based on user type
      if (user_type === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorDetail = error.response?.data?.detail || 'Eroare la autentificare';
      
      // Check if it's a subscription expiry error
      if (errorDetail.includes('Abonamentul a expirat') || errorDetail.includes('expirat')) {
        toast.error('Abonamentul a expirat', {
          description: 'Te rugăm să contactezi administratorul pentru reînnoirea abonamentului.',
          duration: 8000
        });
      } else if (errorDetail.includes('suspendat')) {
        toast.error('Cont suspendat', {
          description: 'Contul tău a fost suspendat. Contactează administratorul pentru mai multe detalii.',
          duration: 8000
        });
      } else {
        toast.error(errorDetail);
      }
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-center min-h-screen px-6 pt-40 pb-20 lg:px-0">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-start lg:pl-12">
          
          {/* Left Side - Features */}
          <div className="space-y-8 animate-fade-in pt-8 lg:pl-0 pl-6">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-3 mb-4">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              <h1 className="text-5xl font-bold leading-tight">
                Bine ai venit înapoi la
                <br />
                <span className="gradient-text">FixGSM Platform</span>
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed">
                Accesează platforma completă de management pentru service-uri GSM. 
                Gestionare inteligentă, rapoarte în timp real și mult mai mult.
              </p>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Shield, text: 'Securitate avansată' },
                { icon: Zap, text: 'Performanță optimizată' },
                { icon: Users, text: 'Management echipă' },
                { icon: Star, text: 'Experiență premium' }
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 glass-effect rounded-xl p-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-slate-300 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="glass-effect rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Autentificare</h2>
                <p className="text-slate-400">Introdu datele tale pentru a accesa platforma</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 font-medium">Email</Label>
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
                      placeholder="email@exemplu.com"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 font-medium">Parolă</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 focus:border-cyan-500 focus:ring-cyan-500/20"
                      data-testid="password-input"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl h-12 text-base font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25"
                  disabled={loading}
                  data-testid="login-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Se autentifică...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Autentificare
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                    onClick={() => navigate('/onboarding')}
                    data-testid="register-link"
                  >
                    Nu ai cont? Înregistrează-te aici
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

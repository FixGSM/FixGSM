import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Smartphone, Users, MapPin, BarChart3, Shield, Zap, ArrowRight, Check, FileText, Clock, Bell, QrCode, Search, Package, Settings, Palette, Star, MessageSquare, Phone, Mail, Smartphone as PhoneIcon, Database, CreditCard, Lock, Eye, MessageCircle, Send, AtSign, Plane, PhoneCall, Calculator } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    {
      icon: Smartphone,
      title: 'Gestionare Completă',
      description: 'Administrează toate reparațiile dintr-un singur loc',
      color: '#0ea5e9'
    },
    {
      icon: Users,
      title: 'Multi-utilizatori',
      description: 'Roluri pentru Recepție, Tehnicieni și Manageri',
      color: '#06b6d4'
    },
    {
      icon: MapPin,
      title: 'Multiple Locații',
      description: 'Gestionează service-uri în mai multe puncte de lucru',
      color: '#3b82f6'
    },
    {
      icon: FileText,
      title: 'Flux Personalizat',
      description: 'Creează propriul flux de lucru fără compromisuri',
      color: '#8b5cf6'
    },
    {
      icon: Database,
      title: 'CRM & Baza Clienți',
      description: 'Toate informațiile despre clienți într-un singur loc',
      color: '#ec4899'
    },
    {
      icon: QrCode,
      title: 'Status QR Real-time',
      description: 'Clienții verifică progresul cu un scan',
      color: '#f59e0b'
    },
    {
      icon: Bell,
      title: 'Notificări Automate',
      description: 'SMS, Email, Telegram - ține toată lumea informată',
      color: '#10b981'
    },
    {
      icon: Search,
      title: 'Căutare IMEI',
      description: 'Identifică dispozitivele instant cu numărul IMEI',
      color: '#f97316'
    },
    {
      icon: Package,
      title: 'Stoc Organizat',
      description: 'Piese de schimb și echipamente la îndemână',
      color: '#6366f1'
    },
    {
      icon: Star,
      title: 'Recenzii Clienți',
      description: 'Sistem 5-stele pentru feedback automat',
      color: '#eab308'
    },
    {
      icon: PhoneIcon,
      title: 'Împrumut Dispozitive',
      description: 'Oferă dispozitive de împrumut clienților',
      color: '#06b6d4'
    },
    {
      icon: Settings,
      title: 'Prețuri Flexibile',
      description: 'Configurează prețuri pentru piese și servicii',
      color: '#8b5cf6'
    },
    {
      icon: Lock,
      title: 'Securitate Avansată',
      description: 'Control accesuri și permisiuni bazate pe roluri',
      color: '#dc2626'
    },
    {
      icon: Palette,
      title: 'Temă Personalizată',
      description: 'Mod luminos sau întunecat - alegerea ta',
      color: '#7c3aed'
    },
    {
      icon: MessageSquare,
      title: 'Integrări Complete',
      description: 'SmartBill, WhatsApp, SMS, Email, Telegram',
      color: '#059669'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '49',
      features: ['1 Locație', '5 Utilizatori', 'Suport Basic', '1000 Fișe/lună', 'CRM Clienți', 'Notificări SMS/Email'],
      trial: '30 zile GRATUIT'
    },
    {
      name: 'Professional',
      price: '99',
      features: ['3 Locații', '15 Utilizatori', 'Suport Priority', 'Fișe Nelimitate', 'Rapoarte Avansate', 'QR Status', 'Integrări Complete'],
      popular: true,
      trial: '30 zile GRATUIT'
    },
    {
      name: 'Enterprise',
      price: '199',
      features: ['Locații Nelimitate', 'Utilizatori Nelimitați', 'Suport 24/7', 'API Access', 'White Label', 'Împrumut Dispozitive'],
      trial: '30 zile GRATUIT'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[96%] max-w-7xl z-50">
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 flex justify-between items-center shadow-2xl shadow-black/20">
          <div className="flex items-center space-x-3" data-testid="logo">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">FixGSM</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => navigate('/client-portal')}
              data-testid="client-portal-btn"
            >
              Portal Clienți
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => navigate('/login')}
              data-testid="login-btn"
            >
              Login
            </Button>
            <Button
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 btn-hover"
              onClick={() => navigate('/onboarding')}
              data-testid="get-started-btn"
            >
              Începe Acum
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center animate-fade-in">
            <h1 className="text-6xl lg:text-8xl font-bold mb-6 leading-tight" data-testid="hero-title">
              Platforma Completă Pentru
              <br />
              <span className="gradient-text">Service-uri GSM</span>
            </h1>
            <p className="text-xl lg:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto" data-testid="hero-subtitle">
              Gestionează clienți, reparații și echipe dintr-o singură platformă modernă. 
              SaaS Multi-Tenant pentru profesioniști.
            </p>
            
            <div className="flex justify-center gap-4 mb-16">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-lg px-8 py-6 btn-hover"
                onClick={() => navigate('/onboarding')}
                data-testid="hero-cta-btn"
              >
                <Zap className="mr-2 w-5 h-5" />
                Start Gratuit 14 Zile
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 text-lg px-8 py-6"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                data-testid="learn-more-btn"
              >
                Află Mai Mult
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="glass-effect rounded-2xl p-6 card-hover" data-testid="stat-services">
                <div className="text-4xl font-bold gradient-text mb-2">500+</div>
                <div className="text-slate-400">Service-uri Active</div>
              </div>
              <div className="glass-effect rounded-2xl p-6 card-hover" data-testid="stat-repairs">
                <div className="text-4xl font-bold gradient-text mb-2">50K+</div>
                <div className="text-slate-400">Reparații Lunare</div>
              </div>
              <div className="glass-effect rounded-2xl p-6 card-hover" data-testid="stat-satisfaction">
                <div className="text-4xl font-bold gradient-text mb-2">99%</div>
                <div className="text-slate-400">Satisfacție Clienți</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 relative bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-5xl font-bold mb-4" data-testid="benefits-title">
              De ce să alegi <span className="gradient-text">FixGSM?</span>
            </h2>
            <p className="text-xl text-slate-400">Modul inteligent de a gestiona un Service de Reparații</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="glass-effect rounded-2xl p-8 card-hover text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Aplicația se adaptează nevoilor tale</h3>
              <p className="text-slate-400 leading-relaxed">
                La FixGSM, tu îți creezi propriul flux de lucru, fără compromisuri și fără să urmezi structuri rigide. 
                Ai libertatea de a personaliza fiecare aspect al aplicației.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-8 card-hover text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">30 de zile gratuit</h3>
              <p className="text-slate-400 leading-relaxed">
                Începe fără riscuri! Testează toate funcționalitățile timp de 30 de zile complet gratuit, 
                fără să fie necesar un card bancar.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-8 card-hover text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Compensare pentru furnizorii actuali</h3>
              <p className="text-slate-400 leading-relaxed">
                Folosești o altă aplicație? Te compensăm pentru perioada plătită deja la alți furnizori! 
                Schimbarea nu mai costă nimic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-fade-in">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <h2 className="text-6xl font-bold mb-6" data-testid="features-title">
              Funcționalități <span className="gradient-text">Premium</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Descoperă un ecosistem complet de instrumente digitale care transformă modul în care gestionezi service-ul de reparații
            </p>
            
            {/* Feature Categories */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {[
                { name: 'Gestionare', gradient: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
                { name: 'Comunicare', gradient: 'bg-gradient-to-r from-purple-500 to-pink-500' },
                { name: 'Automatizare', gradient: 'bg-gradient-to-r from-green-500 to-emerald-500' },
                { name: 'Analiză', gradient: 'bg-gradient-to-r from-orange-500 to-red-500' }
              ].map((category, index) => (
                <div 
                  key={index}
                  className={`px-6 py-2 rounded-full ${category.gradient} opacity-80 hover:opacity-100 transition-opacity duration-300 cursor-pointer`}
                >
                  <span className="text-white text-sm font-medium">{category.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 p-8 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 hover:border-white/20"
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  data-testid={`feature-card-${index}`}
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {/* Background Gradient Effect */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${feature.color}15, transparent)`
                    }}
                  />
                  
                  {/* Floating Elements */}
                  <div className="absolute top-4 right-4 w-20 h-20 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                       style={{
                         background: `radial-gradient(circle, ${feature.color}40, transparent)`,
                         transform: 'translate(10px, -10px)'
                       }}
                  />
                  
                  {/* Icon Container */}
                  <div className="relative z-10 mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                      style={{
                        background: hoveredFeature === index
                          ? `linear-gradient(135deg, ${feature.color}, ${feature.color}cc)`
                          : 'rgba(255, 255, 255, 0.08)',
                        boxShadow: hoveredFeature === index 
                          ? `0 10px 30px ${feature.color}40` 
                          : '0 4px 15px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <Icon 
                        className="w-8 h-8 transition-all duration-500 group-hover:scale-110" 
                        style={{ 
                          color: hoveredFeature === index ? '#ffffff' : feature.color,
                          filter: hoveredFeature === index ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none'
                        }} 
                      />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-3 group-hover:text-white transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Bottom Accent Line */}
                  <div 
                    className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500"
                    style={{ background: `linear-gradient(90deg, ${feature.color}, transparent)` }}
                  />
                  
                  {/* Corner Decoration */}
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white/20 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              );
            })}
          </div>
          
          {/* Features Footer */}
          <div className="mt-20 text-center">
            <div className="glass-effect rounded-3xl p-12 max-w-4xl mx-auto">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold">Ecosistem Complet</h3>
              </div>
              <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
                Toate aceste funcționalități lucrează împreună pentru a crea o experiență seamless și eficientă
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-300">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <span>Integrare perfectă între toate modulele</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span>Securitate și fiabilitate garantate</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span>Suport tehnic dedicat 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4" data-testid="integrations-title">
              Integrări cu <span className="gradient-text">Aplicațiile tale Preferate</span>
            </h2>
            <p className="text-xl text-slate-400">Conectează-te cu cele mai cunoscute platforme pentru optimizarea completă a fluxului de lucru</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-16">
            {[
              { name: 'SmartBill', icon: Calculator, color: 'from-blue-500 to-blue-600' },
              { name: 'WhatsApp', icon: MessageCircle, color: 'from-green-500 to-green-600' },
              { name: 'SMS', icon: Send, color: 'from-purple-500 to-purple-600' },
              { name: 'Email', icon: AtSign, color: 'from-red-500 to-red-600' },
              { name: 'Telegram', icon: Plane, color: 'from-cyan-500 to-cyan-600' },
              { name: 'Zadarma', icon: PhoneCall, color: 'from-orange-500 to-orange-600' }
            ].map((integration, index) => {
              const IconComponent = integration.icon;
              return (
                <div key={index} className="glass-effect rounded-2xl p-6 card-hover text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${integration.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">{integration.name}</h3>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <div className="glass-effect rounded-3xl p-12 card-hover max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold mb-6">Toate informațiile într-un singur loc</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-300">
                <div className="flex items-center space-x-3">
                  <Database className="w-6 h-6 text-cyan-400" />
                  <span>Istoric complet de reparații și service</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Bell className="w-6 h-6 text-cyan-400" />
                  <span>Mesaje automate către clienți prin SMS sau e-mail</span>
                </div>
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-6 h-6 text-cyan-400" />
                  <span>Management eficient pentru afaceri de succes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4" data-testid="pricing-title">
              Prețuri <span className="gradient-text">Transparente</span>
            </h2>
            <p className="text-xl text-slate-400">Alege planul potrivit pentru business-ul tău</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-3xl p-8 card-hover relative ${
                  plan.popular
                    ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500'
                    : 'glass-effect'
                }`}
                data-testid={`pricing-card-${index}`}
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2">
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-1 rounded-full text-sm font-semibold">
                    {plan.trial}
                  </span>
                  {plan.popular && (
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-1 rounded-full text-sm font-semibold">
                      Cel Mai Popular
                    </span>
                  )}
                </div>
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold gradient-text">{plan.price}</span>
                    <span className="text-slate-400 ml-2">EUR/lună</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center text-slate-300">
                      <Check className="w-5 h-5 text-cyan-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                      : 'bg-white/10 hover:bg-white/20'
                  } btn-hover`}
                  onClick={() => navigate('/onboarding')}
                  data-testid={`pricing-cta-${index}`}
                >
                  Începe Acum
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-effect rounded-3xl p-12 card-hover">
            <h2 className="text-5xl font-bold mb-6" data-testid="cta-title">
              Gata să Transformi <span className="gradient-text">Service-ul Tău?</span>
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Alătură-te celor peste 500 de service-uri care folosesc FixGSM zilnic
            </p>
            <div className="flex justify-center gap-8 mb-8 text-slate-300">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-green-400" />
                <span>30 de zile GRATUIT</span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-green-400" />
                <span>Fără card bancar</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Compensare pentru furnizori actuali</span>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-lg px-12 py-6 btn-hover"
              onClick={() => navigate('/onboarding')}
              data-testid="final-cta-btn"
            >
              <Zap className="mr-2 w-5 h-5" />
              Înregistrează-te Gratuit
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>&copy; 2025 FixGSM. Toate drepturile rezervate.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

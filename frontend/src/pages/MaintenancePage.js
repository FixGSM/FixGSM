import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, RefreshCw, Clock, Wrench, AlertTriangle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MaintenancePage = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [supportEmail, setSupportEmail] = useState('support@fixgsm.ro');

  // Check if maintenance mode is still active
  const checkMaintenanceStatus = async () => {
    setChecking(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/maintenance-status`);
      
      if (!response.data.maintenance_mode) {
        // Maintenance is over, redirect to home
        navigate('/login');
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    } finally {
      setChecking(false);
    }
  };

  // Load platform settings for support email
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/maintenance-status`);
        if (response.data.support_email) {
          setSupportEmail(response.data.support_email);
        }
        if (response.data.estimated_time) {
          setEstimatedTime(response.data.estimated_time);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
    
    // Check every 30 seconds if maintenance is over
    const interval = setInterval(checkMaintenanceStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-amber-500/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full">
        <div className="glass-effect rounded-3xl border border-white/10 p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-orange-500 to-amber-500 p-6 rounded-full">
                <Wrench className="w-12 h-12 text-white animate-bounce" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Mentenanță în Curs
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-lg md:text-xl mb-8">
            Lucrăm la îmbunătățirea platformei pentru o experiență mai bună
          </p>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Estimated Time */}
            {estimatedTime && (
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-slate-400 text-sm mb-1">Timp Estimat</p>
                <p className="text-white font-semibold">{estimatedTime}</p>
              </div>
            )}

            {/* Status */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
              <Settings className="w-6 h-6 text-purple-400 mx-auto mb-2 animate-spin" />
              <p className="text-slate-400 text-sm mb-1">Status</p>
              <p className="text-white font-semibold">Actualizare Sistem</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 mb-8">
            <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-3" />
            <p className="text-slate-300 text-sm leading-relaxed">
              Platforma FixGSM este temporar indisponibilă pentru mentenanță programată.
              <br />
              Lucrăm la îmbunătățiri și actualizări pentru a-ți oferi o experiență mai bună.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button
              onClick={checkMaintenanceStatus}
              disabled={checking}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3"
            >
              {checking ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Se verifică...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Verifică Status
                </>
              )}
            </Button>

            {/* Support Contact */}
            <a
              href={`mailto:${supportEmail}`}
              className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">Contact Suport: {supportEmail}</span>
            </a>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-slate-500 text-xs">
              Verificăm automat statusul la fiecare 30 de secunde
            </p>
          </div>
        </div>

        {/* Logo */}
        <div className="text-center mt-8">
          <p className="text-white font-bold text-2xl tracking-wider">
            FIX<span className="text-orange-500">GSM</span>
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Service Management Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;


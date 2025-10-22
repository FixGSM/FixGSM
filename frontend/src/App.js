import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Pages
import LandingPage from '@/pages/LandingPage';
import OnboardingPage from '@/pages/OnboardingPage';
import LoginPage from '@/pages/LoginPage';
import MaintenancePage from '@/pages/MaintenancePage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ServiceDashboard from '@/pages/service/ServiceDashboard';
import LocationsPage from '@/pages/service/LocationsPage';
import EmployeesPage from '@/pages/service/EmployeesPage';
import TicketsPage from '@/pages/service/TicketsPage';
import TicketDetailPage from '@/pages/service/TicketDetailPage';
import SettingsPage from '@/pages/service/SettingsPage';
import ClientsPage from '@/pages/service/ClientsPage';
import ClientDetailPage from '@/pages/service/ClientDetailPage';
import AIChatPage from '@/pages/service/AIChatPage';
import StatisticsPage from '@/pages/StatisticsPage';
import ClientPortal from '@/pages/ClientPortal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Maintenance Guard Component
const MaintenanceGuard = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userType = localStorage.getItem('fixgsm_user_type');
  
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/maintenance-status`);
        const isMaintenanceActive = response.data.maintenance_mode;
        setMaintenanceMode(isMaintenanceActive);
        
        // If maintenance is active and user is not admin, redirect to maintenance page
        if (isMaintenanceActive && userType !== 'admin' && location.pathname !== '/maintenance') {
          navigate('/maintenance', { replace: true });
        }
        // If maintenance is off and user is on maintenance page, redirect to login
        else if (!isMaintenanceActive && location.pathname === '/maintenance') {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Error checking maintenance:', error);
      } finally {
        setChecking(false);
      }
    };
    
    checkMaintenance();
    
    // Check every 30 seconds
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, [location.pathname, navigate, userType]);
  
  // Show loading only on first check
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          Se verifică statusul platformei...
        </div>
      </div>
    );
  }
  
  // Block access if maintenance is active and user is not admin
  if (maintenanceMode && userType !== 'admin' && location.pathname !== '/maintenance') {
    return <Navigate to="/maintenance" replace />;
  }
  
  return children;
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedTypes }) => {
  const token = localStorage.getItem('fixgsm_token');
  const userType = localStorage.getItem('fixgsm_user_type');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedTypes && !allowedTypes.includes(userType)) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <LanguageProvider>
        <MaintenanceGuard>
          <Routes>
            {/* Maintenance Route */}
            <Route path="/maintenance" element={<MaintenancePage />} />
            
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/client-portal" element={<ClientPortal />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedTypes={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Service Owner & Employee Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedTypes={['tenant_owner', 'employee']}>
                <ServiceDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute allowedTypes={['tenant_owner', 'employee']}>
                <TicketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute allowedTypes={['tenant_owner', 'employee']}>
                <ClientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:clientId"
            element={
              <ProtectedRoute allowedTypes={['tenant_owner', 'employee']}>
                <ClientDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/:ticketId"
            element={
              <ProtectedRoute allowedTypes={['tenant_owner', 'employee']}>
                <TicketDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-chat"
            element={
              <ProtectedRoute allowedTypes={['tenant_owner', 'employee']}>
                <AIChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statistics-ai"
            element={
              <ProtectedRoute allowedTypes={['tenant_owner', 'employee']}>
                <StatisticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedTypes={['tenant_owner']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          </Routes>
        </MaintenanceGuard>
        </LanguageProvider>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;

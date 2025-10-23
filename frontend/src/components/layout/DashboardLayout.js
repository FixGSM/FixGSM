import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Smartphone,
  MapPin,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const notifications = [
  { id: 1, icon: <AlertCircle className="w-4 h-4 text-amber-400 mr-2 flex-shrink-0" />, text: 'Fișă nouă deschisă', time: 'acum 3 min' },
  { id: 2, icon: <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />, text: 'Service marcat finalizat', time: 'acum 25 min' },
  { id: 3, icon: <Bell className="w-4 h-4 text-pink-400 mr-2 flex-shrink-0" />, text: '1 mesaj necitit', time: 'azi' },
];

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  // Dropdown state & handler
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!notifOpen) return;
    // click in afara popover -> inchide
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifOpen]);

  const userType = localStorage.getItem('fixgsm_user_type');
  const userName = localStorage.getItem('fixgsm_name');
  const role = localStorage.getItem('fixgsm_role');

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: t('nav.dashboard'),
      path: '/dashboard',
      allowedTypes: ['tenant_owner', 'employee'],
      action: null
    },
    {
      icon: Users,
      label: t('nav.clients'),
      path: '/clients',
      allowedTypes: ['tenant_owner', 'employee'],
      action: null
    },
    {
      icon: FileText,
      label: t('nav.tickets'),
      path: '/dashboard',
      allowedTypes: ['tenant_owner', 'employee'],
      action: 'createTicket'
    },
    {
      icon: Sparkles,
      label: 'AI Assistant',
      path: '/ai-chat',
      allowedTypes: ['tenant_owner', 'employee'],
      action: null
    },
    {
      icon: BarChart3,
      label: 'Analiză Statistici AI',
      path: '/statistics-ai',
      allowedTypes: ['tenant_owner', 'employee'],
      action: 'statisticsAI'
    },
    {
      icon: Settings,
      label: t('nav.settings'),
      path: '/settings',
      allowedTypes: ['tenant_owner'],
      action: null
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.allowedTypes.includes(userType)
  );

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />


      {/* Floating Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-72'
        } glass-effect rounded-2xl transition-all duration-300 flex flex-col fixed top-6 left-6 bottom-6 z-30 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 shadow-2xl shadow-black/20`}
        data-testid="sidebar"
      >
        {/* Logo & Notification Bell */}
        <div className={`${collapsed ? 'p-3' : 'p-6'} border-b border-white/10 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {!collapsed && (
              <span className="text-2xl font-bold gradient-text animate-fade-in">FixGSM</span>
            )}
            {/* Notification Bell in Sidebar */}
            <div className="relative">
              <button
                className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-pink-500 via-fuchsia-500 to-cyan-500 shadow-lg rounded-xl border border-white/10 hover:scale-105 transition-all duration-150 focus:outline-none"
                aria-label="Notificări"
                onClick={() => setNotifOpen(v => !v)}
              >
                <Bell className="w-5 h-5 text-white drop-shadow-[0_1px_4px_rgba(236,72,153,0.4)]" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border border-white/30 flex items-center justify-center bg-gradient-to-tr from-rose-500 to-pink-400 text-[10px] font-bold text-white shadow drop-shadow animate-pulse">
                  3
                </span>
              </button>
              {notifOpen && (
                <div ref={notifRef} className="absolute left-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-xl py-2 px-0 animate-fade-in z-50"
                  style={{boxShadow: '0 6px 48px 0 rgba(50,18,98,0.28)'}}
                >
                  <div className="px-5 py-3 border-b border-white/10 text-slate-200 text-base font-semibold flex items-center gap-2">
                    <Bell className="w-5 h-5 text-pink-400 mr-2" /> Notificări
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} className="flex items-center gap-2 px-5 py-3 hover:bg-slate-800/60 cursor-pointer transition">
                      {n.icon}
                      <div className="flex flex-col text-sm">
                        <span className="text-slate-100 leading-tight">{n.text}</span>
                        <span className="text-xs text-slate-400">{n.time}</span>
                      </div>
                    </div>
                  ))}
                  <div className="px-5 py-2 text-xs text-right text-cyan-400 hover:underline cursor-pointer select-none">Vezi tot</div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl hidden md:flex transition-all duration-300"
              onClick={() => setCollapsed(!collapsed)}
              data-testid="collapse-btn"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl md:hidden transition-all duration-300"
              onClick={() => setMobileOpen(false)}
              data-testid="close-mobile-menu"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* User Info */}
        <div className={`${collapsed ? 'p-3' : 'p-6'} border-b border-white/10 flex items-center justify-center`}>
          {!collapsed ? (
            <div className="animate-fade-in">
              <p className="text-white font-semibold truncate text-lg" data-testid="user-name">{userName}</p>
              <p className="text-slate-400 text-sm truncate mt-1">{role || userType}</p>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="text-white font-bold text-sm">{userName?.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'p-3 pt-8' : 'p-6 pt-12'} space-y-2`} data-testid="nav-menu">
          {filteredMenuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            // Define colors for each menu item
            const getMenuColors = (path, action) => {
              // Special case for Fișe Service button
              if (action === 'createTicket') {
                return {
                  bg: 'from-emerald-500/30 to-green-500/30',
                  border: 'border-emerald-500/40',
                  shadow: 'shadow-emerald-500/20',
                  text: 'text-emerald-400',
                  iconBg: 'from-emerald-500 to-green-500'
                };
              }
              
              switch (path) {
                case '/dashboard':
                  return {
                    bg: 'from-cyan-500/30 to-blue-500/30',
                    border: 'border-cyan-500/40',
                    shadow: 'shadow-cyan-500/20',
                    text: 'text-cyan-400',
                    iconBg: 'from-cyan-500 to-blue-500'
                  };
                case '/clients':
                  return {
                    bg: 'from-fuchsia-500/30 to-pink-500/30',
                    border: 'border-pink-500/40',
                    shadow: 'shadow-pink-500/20',
                    text: 'text-pink-400',
                    iconBg: 'from-fuchsia-500 to-pink-500'
                  };
                case '/tickets':
                  return {
                    bg: 'from-emerald-500/30 to-green-500/30',
                    border: 'border-emerald-500/40',
                    shadow: 'shadow-emerald-500/20',
                    text: 'text-emerald-400',
                    iconBg: 'from-emerald-500 to-green-500'
                  };
                case '/locations':
                  return {
                    bg: 'from-purple-500/30 to-violet-500/30',
                    border: 'border-purple-500/40',
                    shadow: 'shadow-purple-500/20',
                    text: 'text-purple-400',
                    iconBg: 'from-purple-500 to-violet-500'
                  };
                case '/employees':
                  return {
                    bg: 'from-orange-500/30 to-red-500/30',
                    border: 'border-orange-500/40',
                    shadow: 'shadow-orange-500/20',
                    text: 'text-orange-400',
                    iconBg: 'from-orange-500 to-red-500'
                  };
                case '/ai-chat':
                  return {
                    bg: 'from-violet-500/30 to-purple-500/30',
                    border: 'border-violet-500/40',
                    shadow: 'shadow-violet-500/20',
                    text: 'text-violet-400',
                    iconBg: 'from-violet-500 to-purple-500'
                  };
                case '/statistics-ai':
                  return {
                    bg: 'from-indigo-500/30 to-blue-500/30',
                    border: 'border-indigo-500/40',
                    shadow: 'shadow-indigo-500/20',
                    text: 'text-indigo-400',
                    iconBg: 'from-indigo-500 to-blue-500'
                  };
                case '/settings':
                  return {
                    bg: 'from-gray-500/30 to-slate-500/30',
                    border: 'border-gray-500/40',
                    shadow: 'shadow-gray-500/20',
                    text: 'text-gray-400',
                    iconBg: 'from-gray-500 to-slate-500'
                  };
                default:
                  return {
                    bg: 'from-slate-500/30 to-gray-500/30',
                    border: 'border-slate-500/40',
                    shadow: 'shadow-slate-500/20',
                    text: 'text-slate-400',
                    iconBg: 'from-slate-500 to-gray-500'
                  };
              }
            };
            
            const colors = getMenuColors(item.path, item.action);
            
            return (
              <Button
                key={`${item.path}-${item.action || 'default'}`}
                variant="ghost"
                className={`w-full ${collapsed ? 'justify-center px-2' : 'justify-start px-4'} ${
                  collapsed ? 'h-12' : 'h-14'
                } rounded-xl transition-all duration-300 hover:transform hover:scale-105 ${
                  isActive
                    ? `bg-gradient-to-r ${colors.bg} ${colors.text} border ${colors.border} shadow-lg ${colors.shadow}`
                    : item.action === 'createTicket'
                      ? 'text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => {
                  if (item.action === 'createTicket') {
                    // Trigger create ticket action
                    window.dispatchEvent(new CustomEvent('createTicket'));
                  } else {
                    navigate(item.path);
                  }
                  setMobileOpen(false);
                }}
                data-testid={`menu-${item.path}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`${collapsed ? 'w-8 h-8' : 'w-6 h-6'} flex items-center justify-center`}>
                  {collapsed ? (
                    <div className={`w-8 h-8 bg-gradient-to-br ${colors.iconBg} rounded-lg flex items-center justify-center shadow-md`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <Icon className="w-6 h-6 flex-shrink-0" />
                  )}
                </div>
                {!collapsed && <span className="font-medium ml-4">{item.label}</span>}
              </Button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className={`${collapsed ? 'p-3' : 'p-6'} border-t border-white/10`}>
          <Button
            variant="ghost"
            className={`w-full ${collapsed ? 'justify-center px-2' : 'justify-start px-4'} ${
              collapsed ? 'h-12' : 'h-14'
            } rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 hover:transform hover:scale-105`}
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <div className={`${collapsed ? 'w-8 h-8' : 'w-6 h-6'} flex items-center justify-center`}>
              {collapsed ? (
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                  <LogOut className="w-4 h-4 text-white" />
                </div>
              ) : (
                <LogOut className="w-6 h-6 flex-shrink-0" />
              )}
            </div>
            {!collapsed && <span className="font-medium ml-4">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${collapsed ? 'md:ml-28' : 'md:ml-80'} transition-all duration-300`}>

        {/* Mobile Header */}
        <header className="md:hidden glass-effect rounded-2xl m-4 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
            onClick={() => setMobileOpen(true)}
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">FixGSM</span>
          </div>
          {/* Right side intentionally empty; bell exists as fixed button */}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
          data-testid="mobile-overlay"
        />
      )}
    </div>
  );
};

export default DashboardLayout;

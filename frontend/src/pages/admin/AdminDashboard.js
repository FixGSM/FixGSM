import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';   
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, User, DollarSign, TrendingUp, CheckCircle, LogOut, Clock, Bell, 
  Settings, Database, Key, BarChart3, Server, RefreshCw, Download,
  Shield, Edit, Trash2, XCircle, AlertTriangle, Activity, HardDrive,
  Cpu, Wifi, Mail, Globe, Package, FileText, Search
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [serverInfo, setServerInfo] = useState(null);
  const [aiConfig, setAiConfig] = useState({ api_key: '', model: 'gemini-2.5-flash', enabled: true });
  const [aiStats, setAiStats] = useState({
    last_24h: { total_calls: 0, total_cost: 0 },
    all_time: { total_calls: 0, total_cost: 0 },
    tenant_usage: [],
    hourly_usage: []
  });
  const [aiStatsLoading, setAiStatsLoading] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [editTenantDialog, setEditTenantDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [editFormData, setEditFormData] = useState({
    subscription_price: 0,
    subscription_end_date: '',
    subscription_status: 'pending'
  });
  const [addEmployeeDialog, setAddEmployeeDialog] = useState(false);
  const [viewEmployeesDialog, setViewEmployeesDialog] = useState(false);
  const [tenantEmployees, setTenantEmployees] = useState([]);
  const [tenantLocations, setTenantLocations] = useState([]);
  const [newEmployeeData, setNewEmployeeData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Technician',
    location_id: ''
  });
  const [editingPlan, setEditingPlan] = useState({
    name: '',
    price: 0,
    features: [],
    limits: { locations: 1, employees: 3, has_ai: false }
  });
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info',
    is_active: true,
    expires_at: ''
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [platformSettings, setPlatformSettings] = useState({
    maintenance_mode: false,
    auto_approve_tenants: true,
    notification_email: '',
    landing_page_url: '',
    support_email: '',
    estimated_maintenance_time: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [backups, setBackups] = useState([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsStats, setLogsStats] = useState(null);
  const [logsFilter, setLogsFilter] = useState({
    log_type: '',
    level: '',
    category: '',
    tenant_id: ''
  });
  const [logsPage, setLogsPage] = useState(0);
  const [logsTotalCount, setLogsTotalCount] = useState(0);
  const logsLimit = 50;

  const token = localStorage.getItem('fixgsm_token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, tenantsRes, activityRes] = await Promise.all([
        axios.get(`${API}/admin/statistics`, config),
        axios.get(`${API}/admin/tenants`, config),
        axios.get(`${API}/admin/recent-activity`, config)
      ]);
      setStats(statsRes.data);
      setTenants(tenantsRes.data);
      setRecentActivity(activityRes.data);
      
      if (activeTab === 'server') {
        const serverRes = await axios.get(`${API}/admin/server-info`, config);
        setServerInfo(serverRes.data);
      }
      
      if (activeTab === 'ai') {
        setAiStatsLoading(true);
        try {
          const [aiRes, aiStatsRes] = await Promise.all([
            axios.get(`${API}/admin/ai-config`, config),
            axios.get(`${API}/admin/ai-statistics`, config)
          ]);
          setAiConfig(aiRes.data);
          setAiStats(aiStatsRes.data);
        } catch (error) {
          console.error('Error fetching AI data:', error);
          toast.error('Eroare la încărcarea statisticilor AI');
        } finally {
          setAiStatsLoading(false);
        }
      }
      
      if (activeTab === 'subscriptions') {
        const plansRes = await axios.get(`${API}/admin/subscription-plans`, config);
        setSubscriptionPlans(plansRes.data);
      }
      
      if (activeTab === 'announcements') {
        const announcementsRes = await axios.get(`${API}/admin/announcements`, config);
        setAnnouncements(announcementsRes.data);
      }
      
      if (activeTab === 'settings') {
        const settingsRes = await axios.get(`${API}/admin/platform-settings`, config);
        setPlatformSettings({
          maintenance_mode: settingsRes.data.maintenance_mode || false,
          auto_approve_tenants: settingsRes.data.auto_approve_tenants !== undefined ? settingsRes.data.auto_approve_tenants : true,
          notification_email: settingsRes.data.notification_email || '',
          landing_page_url: settingsRes.data.landing_page_url || '',
          support_email: settingsRes.data.support_email || '',
          estimated_maintenance_time: settingsRes.data.estimated_maintenance_time || ''
        });
      }
      
      if (activeTab === 'backup') {
        const backupsRes = await axios.get(`${API}/admin/backups`, config);
        setBackups(backupsRes.data);
      }
      
      if (activeTab === 'logs') {
        // Fetch logs with filters
        const params = new URLSearchParams({
          limit: logsLimit.toString(),
          offset: (logsPage * logsLimit).toString()
        });
        if (logsFilter.log_type) params.append('log_type', logsFilter.log_type);
        if (logsFilter.level) params.append('level', logsFilter.level);
        if (logsFilter.category) params.append('category', logsFilter.category);
        if (logsFilter.tenant_id) params.append('tenant_id', logsFilter.tenant_id);
        
        const logsRes = await axios.get(`${API}/admin/logs?${params}`, config);
        setLogs(logsRes.data.logs);
        setLogsTotalCount(logsRes.data.total);
        
        // Fetch stats
        const statsRes = await axios.get(`${API}/admin/logs/stats`, config);
        setLogsStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTenant = async () => {
    try {
      console.log('Selected Tenant:', selectedTenant);
      console.log('Edit Form Data:', editFormData);

      // Update subscription end date
      if (editFormData.subscription_end_date) {
        console.log('Updating subscription end date:', {
          tenant_id: selectedTenant.tenant_id,
          end_date: editFormData.subscription_end_date
        });
        
        await axios.post(`${API}/admin/update-subscription-end-date`, {
          tenant_id: selectedTenant.tenant_id,
          end_date: editFormData.subscription_end_date
        }, config);
      }

      // Update tenant status
      console.log('Updating tenant status:', {
        tenant_id: selectedTenant.tenant_id,
        status: editFormData.subscription_status
      });
      
      await axios.post(`${API}/admin/toggle-tenant-status`, {
        tenant_id: selectedTenant.tenant_id,
        status: editFormData.subscription_status
      }, config);

      toast.success('Tenant actualizat cu succes!');
      setEditTenantDialog(false);
      setSelectedTenant(null);
      fetchData();
    } catch (error) {
      console.error('Error updating tenant:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Eroare la actualizarea tenant-ului');
    }
  };

  const handleResetPassword = async (tenantId) => {
    try {
      await axios.post(`${API}/admin/reset-password`, {
        tenant_id: tenantId,
        new_password: newPassword
      }, config);
      toast.success('Parola a fost resetată cu succes!');
      setResetPasswordDialog(false);
      setNewPassword('');
      setSelectedTenant(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Eroare la resetarea parolei');
    }
  };

  const handleToggleTenantStatus = async (tenantId, currentStatus) => {
    try {
      await axios.post(`${API}/admin/toggle-tenant-status`, {
        tenant_id: tenantId,
        status: currentStatus === 'active' ? 'suspended' : 'active'
      }, config);
      toast.success(`Tenant ${currentStatus === 'active' ? 'suspendat' : 'activat'} cu succes!`);
      fetchData();
    } catch (error) {
      console.error('Error toggling tenant status:', error);
      toast.error('Eroare la schimbarea statusului');
    }
  };

  const handleUpdateAIConfig = async () => {
    try {
      await axios.put(`${API}/admin/ai-config`, aiConfig, config);
      toast.success('Configurare AI actualizată cu succes!');
    } catch (error) {
      console.error('Error updating AI config:', error);
      toast.error('Eroare la actualizarea configurării AI');
    }
  };

  const handleUpdateSubscriptionPlan = async (planId, updates) => {
    try {
      await axios.put(`${API}/admin/subscription-plans/${planId}`, updates, config);
      toast.success('Plan actualizat cu succes!');
      fetchData();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Eroare la actualizarea planului');
    }
  };

  const handleRestartServer = async () => {
    try {
      await axios.post(`${API}/admin/restart-server`, {}, config);
      toast.success('Server repornit cu succes!');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('Error restarting server:', error);
      toast.error('Eroare la repornirea serverului');
    }
  };

  const handleViewEmployees = async (tenant) => {
    try {
      const [employeesRes, locationsRes] = await Promise.all([
        axios.get(`${API}/admin/tenant-employees/${tenant.tenant_id}`, config),
        axios.get(`${API}/admin/tenant-locations/${tenant.tenant_id}`, config)
      ]);
      
      setTenantEmployees(employeesRes.data.employees || []);
      setTenantLocations(locationsRes.data.locations || []);
      setSelectedTenant(tenant);
      setViewEmployeesDialog(true);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Eroare la încărcarea angajaților');
    }
  };

  const handleAddEmployee = async () => {
    try {
      await axios.post(`${API}/admin/create-employee`, {
        tenant_id: selectedTenant.tenant_id,
        ...newEmployeeData
      }, config);
      
      toast.success('Angajat adăugat cu succes!');
      setAddEmployeeDialog(false);
      setNewEmployeeData({ name: '', email: '', password: '', role: 'Technician', location_id: '' });
      
      // Refresh employee list
      await handleViewEmployees(selectedTenant);
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error(error.response?.data?.detail || 'Eroare la adăugarea angajatului');
    }
  };

  const handleDeleteEmployee = async (userId) => {
    if (!window.confirm('Sigur vrei să ștergi acest utilizator?')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/admin/delete-employee/${userId}`, config);
      toast.success('Utilizator șters cu succes!');
      
      // Refresh employee list
      await handleViewEmployees(selectedTenant);
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Eroare la ștergerea utilizatorului');
    }
  };

  const handleUpdatePlan = async (planId) => {
    try {
      setUpdatingPlan(true);
      await axios.put(`${API}/admin/subscription-plans/${planId}`, editingPlan, config);
      toast.success("Plan actualizat cu succes!");
      
      // Refresh plans
      const plansRes = await axios.get(`${API}/admin/subscription-plans`, config);
      setSubscriptionPlans(plansRes.data);
      
      // Reset editing state
      setEditingPlan({
        name: '',
        price: 0,
        features: [],
        limits: { locations: 1, employees: 3, has_ai: false }
      });
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error("Eroare la actualizarea planului");
    } finally {
      setUpdatingPlan(false);
    }
  };

  const openEditPlan = (plan) => {
    setEditingPlan({
      name: plan.name,
      price: plan.price,
      features: [...plan.features],
      limits: { ...plan.limits }
    });
  };

  const handleCreateAnnouncement = async () => {
    try {
      await axios.post(`${API}/admin/announcements`, newAnnouncement, config);
      toast.success("Anunț creat cu succes!");
      
      // Refresh announcements
      const announcementsRes = await axios.get(`${API}/admin/announcements`, config);
      setAnnouncements(announcementsRes.data);
      
      // Reset form
      setNewAnnouncement({
        title: '',
        message: '',
        type: 'info',
        is_active: true,
        expires_at: ''
      });
      setShowAnnouncementDialog(false);
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error("Eroare la crearea anunțului");
    }
  };

  const handleUpdateAnnouncement = async (announcementId) => {
    try {
      await axios.put(`${API}/admin/announcements/${announcementId}`, editingAnnouncement, config);
      toast.success("Anunț actualizat cu succes!");
      
      // Refresh announcements
      const announcementsRes = await axios.get(`${API}/admin/announcements`, config);
      setAnnouncements(announcementsRes.data);
      
      setEditingAnnouncement(null);
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error("Eroare la actualizarea anunțului");
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Sigur vrei să ștergi acest anunț?')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/admin/announcements/${announcementId}`, config);
      toast.success("Anunț șters cu succes!");
      
      // Refresh announcements
      const announcementsRes = await axios.get(`${API}/admin/announcements`, config);
      setAnnouncements(announcementsRes.data);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error("Eroare la ștergerea anunțului");
    }
  };

  const toggleAnnouncementActive = async (announcement) => {
    try {
      await axios.put(
        `${API}/admin/announcements/${announcement.announcement_id}`, 
        { is_active: !announcement.is_active }, 
        config
      );
      toast.success(`Anunț ${!announcement.is_active ? 'activat' : 'dezactivat'}!`);
      
      // Refresh announcements
      const announcementsRes = await axios.get(`${API}/admin/announcements`, config);
      setAnnouncements(announcementsRes.data);
    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast.error("Eroare la modificarea anunțului");
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await axios.put(`${API}/admin/platform-settings`, platformSettings, config);
      toast.success("Setări salvate cu succes!");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Eroare la salvarea setărilor");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      toast.info("Se creează backup-ul...");
      
      const response = await axios.post(`${API}/admin/backup`, {}, config);
      
      if (response.data.error) {
        toast.warning(response.data.message);
        toast.info(response.data.note);
      } else {
        toast.success(`Backup creat cu succes! Dimensiune: ${response.data.size_mb} MB`);
        
        // Refresh backup list
        const backupsRes = await axios.get(`${API}/admin/backups`, config);
        setBackups(backupsRes.data);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error(error.response?.data?.detail || "Eroare la crearea backup-ului");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (backupId, filename) => {
    try {
      toast.info("Se descarcă backup-ul...");
      
      const response = await axios.get(`${API}/admin/backup/${backupId}/download`, {
        ...config,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Backup descărcat cu succes!");
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error("Eroare la descărcarea backup-ului");
    }
  };

  const handleRestoreBackup = async (backupId) => {
    if (!window.confirm('⚠️ ATENȚIE! Această acțiune va înlocui TOATE datele existente cu cele din backup. Sigur vrei să continui?')) {
      return;
    }
    
    if (!window.confirm('Ești ABSOLUT SIGUR? Această operațiune NU POATE FI ANULATĂ!')) {
      return;
    }
    
    try {
      setRestoringBackup(true);
      toast.info("Se restaurează baza de date...");
      
      const response = await axios.post(`${API}/admin/backup/${backupId}/restore`, {}, config);
      
      if (response.data.error) {
        toast.warning(response.data.message);
        toast.info(response.data.note);
      } else {
        toast.success("Baza de date a fost restaurată cu succes!");
        toast.info("Se recomandă reîncărcarea paginii...");
        
        // Refresh page after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error(error.response?.data?.detail || "Eroare la restaurarea backup-ului");
    } finally {
      setRestoringBackup(false);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!window.confirm('Sigur vrei să ștergi acest backup?')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/admin/backup/${backupId}`, config);
      toast.success("Backup șters cu succes!");
      
      // Refresh backup list
      const backupsRes = await axios.get(`${API}/admin/backups`, config);
      setBackups(backupsRes.data);
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error("Eroare la ștergerea backup-ului");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    toast.success('Deconectare reușită');
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && activeTab === 'overview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent" data-testid="admin-title">
              FixGSM Control Center
            </h1>
            <p className="text-slate-400 text-sm">Platform Administration & Management</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 relative"
              aria-label="Notificări"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center justify-center">
                  3
                </span>
            </Button>
            <Button
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-white/10 hover:border-cyan-500/30 transition-all duration-300" data-testid="stat-total-services">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total Tenants</p>
                  <p className="text-4xl font-bold text-white mt-2">{stats?.total_services || 0}</p>
                  <p className="text-cyan-400 text-xs mt-1">+12% vs luna trecută</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                  <Users className="w-7 h-7 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/10 hover:border-green-500/30 transition-all duration-300" data-testid="stat-active-services">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Active</p>
                  <p className="text-4xl font-bold text-green-400 mt-2">{stats?.active_services || 0}</p>
                  <p className="text-green-400 text-xs mt-1">Operational</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/10 hover:border-amber-500/30 transition-all duration-300" data-testid="stat-pending-services">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">În Așteptare</p>
                  <p className="text-4xl font-bold text-amber-400 mt-2">{stats?.pending_services || 0}</p>
                  <p className="text-amber-400 text-xs mt-1">Necesită aprobare</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/10 hover:border-blue-500/30 transition-all duration-300" data-testid="stat-revenue">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Revenue Lunar</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mt-2">
                    {stats?.total_revenue || 0} €
                  </p>
                  <p className="text-blue-400 text-xs mt-1">MRR</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-effect border-white/10 p-1 inline-flex gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-4 py-2 rounded-lg">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tenants" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-4 py-2 rounded-lg">
              <Users className="w-4 h-4 mr-2" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-4 py-2 rounded-lg">
              <Package className="w-4 h-4 mr-2" />
              Abonamente
            </TabsTrigger>
            <TabsTrigger value="announcements" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-4 py-2 rounded-lg">
              <Bell className="w-4 h-4 mr-2" />
              Anunțuri
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-4 py-2 rounded-lg">
              <Key className="w-4 h-4 mr-2" />
              AI Config
            </TabsTrigger>
            <TabsTrigger value="server" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-4 py-2 rounded-lg">
              <Server className="w-4 h-4 mr-2" />
              Server
            </TabsTrigger>
            <TabsTrigger value="backup" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-4 py-2 rounded-lg">
              <Database className="w-4 h-4 mr-2" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-4 py-2 rounded-lg">
              <FileText className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 px-4 py-2 rounded-lg">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="glass-effect border-white/10">
          <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Activitate Recentă
                  </CardTitle>
            <CardDescription className="text-slate-400">
                    Ultimele evenimente din platformă
            </CardDescription>
          </CardHeader>
          <CardContent>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${
                            activity.icon_color === 'cyan' ? 'bg-cyan-400' :
                            activity.icon_color === 'green' ? 'bg-green-400' :
                            activity.icon_color === 'purple' ? 'bg-purple-400' :
                            activity.icon_color === 'blue' ? 'bg-blue-400' :
                            activity.icon_color === 'amber' ? 'bg-amber-400' :
                            'bg-slate-400'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium leading-snug">{activity.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {activity.user_email && activity.user_email !== 'System' && (
                                <span className="text-slate-400 text-xs">👤 {activity.user_email}</span>
                              )}
                              <span className="text-slate-500 text-xs">•</span>
                              <span className="text-slate-400 text-xs">{activity.time_ago}</span>
                            </div>
                          </div>
                          {activity.level === 'warning' && (
                            <span className="text-amber-400 text-xs">⚠️</span>
                          )}
                          {activity.level === 'error' && (
                            <span className="text-red-400 text-xs">❌</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">Nu există activitate recentă</p>
                        <p className="text-sm mt-2">Activitatea va apărea aici automat</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Statistici Rapide
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Metrici importante
                  </CardDescription>
                </CardHeader>
                <CardContent>
              <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-400">Total fișe service</span>
                      <span className="text-white font-bold">{stats?.total_tickets?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-400">Utilizatori activi</span>
                      <span className="text-white font-bold">{stats?.active_users || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-400">API Calls (24h)</span>
                      <span className="text-white font-bold">{stats?.api_calls_24h?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-400">Uptime</span>
                      <span className="text-green-400 font-bold">{stats?.uptime_percent || '99.9'}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Gestionare Tenants</CardTitle>
                    <CardDescription className="text-slate-400">
                      Administrează toate service-urile din platformă
                    </CardDescription>
                  </div>
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Caută tenant..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white rounded-xl pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
              <div className="space-y-4">
                  {filteredTenants.map((tenant) => (
                    <div
                      key={tenant.tenant_id}
                      className="bg-slate-800/50 rounded-xl p-6 border border-white/5 hover:border-cyan-500/30 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{tenant.service_name}</h3>
                            <p className="text-slate-400 text-sm">{tenant.email}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={tenant.subscription_status === 'active' ? 'default' : 'secondary'}
                          className={tenant.subscription_status === 'active' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}
                        >
                          {tenant.subscription_status || 'pending'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <p className="text-slate-400 text-xs">Proprietar</p>
                          <p className="text-white text-sm font-medium">{tenant.owner_name}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Plan</p>
                          <p className="text-white text-sm font-medium">{tenant.subscription_plan || 'Trial'}</p>
                          {tenant.is_trial && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs mt-1">
                              Trial
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Expiră</p>
                          <p className="text-white text-sm font-medium">
                            {tenant.subscription_end_date 
                              ? new Date(tenant.subscription_end_date).toLocaleDateString('ro-RO')
                              : 'N/A'}
                          </p>
                          {tenant.subscription_end_date && (() => {
                            const daysLeft = Math.ceil((new Date(tenant.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24));
                            return daysLeft <= 7 && daysLeft >= 0 ? (
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs mt-1">
                                {daysLeft} zile
                              </Badge>
                            ) : daysLeft < 0 ? (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs mt-1">
                                Expirat
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Telefon</p>
                          <p className="text-white text-sm font-medium">{tenant.phone}</p>
                      </div>
                        <div>
                          <p className="text-slate-400 text-xs">Abonament</p>
                          <p className="text-white text-sm font-medium">{tenant.subscription_price || 0} RON/lună</p>
                      </div>
                    </div>

                      <div className="flex gap-2 flex-wrap">
                        <Dialog open={editTenantDialog} onOpenChange={setEditTenantDialog}>
                      <DialogTrigger asChild>
                        <Button
                              size="sm" 
                              className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setEditFormData({
                                  subscription_price: tenant.subscription_price || 0,
                                  subscription_end_date: tenant.subscription_end_date?.split('T')[0] || '',
                                  subscription_status: tenant.subscription_status || 'pending'
                                });
                                setEditTenantDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editează
                        </Button>
                      </DialogTrigger>
                          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
                        <DialogHeader>
                              <DialogTitle>Editează Tenant</DialogTitle>
                          <DialogDescription className="text-slate-400">
                                Modifică informațiile pentru {selectedTenant?.service_name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                                <Label className="text-slate-300">Preț Abonament (EUR/lună)</Label>
                            <Input
                              type="number"
                                  value={editFormData.subscription_price}
                                  onChange={(e) => setEditFormData({
                                    ...editFormData,
                                    subscription_price: Number(e.target.value)
                                  })}
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                              <div>
                                <Label className="text-slate-300">Data Expirare Abonament</Label>
                                <Input
                                  type="date"
                                  value={editFormData.subscription_end_date ? editFormData.subscription_end_date.split('T')[0] : ''}
                                  onChange={(e) => {
                                    const dateValue = e.target.value;
                                    if (dateValue) {
                                      // Create date at noon UTC to avoid timezone issues
                                      const isoDate = new Date(dateValue + 'T12:00:00.000Z').toISOString();
                                      console.log('Date selected:', dateValue, '-> ISO:', isoDate);
                                      setEditFormData({
                                        ...editFormData,
                                        subscription_end_date: isoDate
                                      });
                                    }
                                  }}
                                  className="bg-slate-800 border-slate-700 text-white"
                                />
                              </div>
                              <div>
                                <Label className="text-slate-300">Status</Label>
                                <Select 
                                  value={editFormData.subscription_status}
                                  onValueChange={(value) => setEditFormData({
                                    ...editFormData,
                                    subscription_status: value
                                  })}
                                >
                                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                  </SelectContent>
                                </Select>
                          </div>
                          <Button
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                onClick={handleEditTenant}
                          >
                                Salvează Modificări
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                        <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                              onClick={() => setSelectedTenant(tenant)}
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Resetează Parolă
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
                            <DialogHeader>
                              <DialogTitle>Resetează Parolă</DialogTitle>
                              <DialogDescription className="text-slate-400">
                                Setează o parolă nouă pentru {selectedTenant?.service_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label className="text-slate-300">Parolă Nouă</Label>
                                <Input
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="bg-slate-800 border-slate-700 text-white"
                                  placeholder="Minim 8 caractere"
                                />
                              </div>
                              <Button 
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500"
                                onClick={() => handleResetPassword(selectedTenant?.tenant_id)}
                                disabled={newPassword.length < 8}
                              >
                                Confirmă Resetare
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          size="sm" 
                          className={tenant.subscription_status === 'active'
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                          }
                          onClick={() => handleToggleTenantStatus(tenant.tenant_id, tenant.subscription_status)}
                        >
                          {tenant.subscription_status === 'active' ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Suspendă
                            </>
                          ) : (
                            <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                              Activează
                            </>
                          )}
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Extindere Trial/Grație
                        </Button>
                      </DialogTrigger>
                          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
                        <DialogHeader>
                              <DialogTitle>Extindere Perioadă</DialogTitle>
                          <DialogDescription className="text-slate-400">
                                Extinde perioada de trial sau grație pentru {tenant.service_name}
                          </DialogDescription>
                        </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-3">
                                <Button 
                                  className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30"
                                  onClick={async () => {
                                    try {
                                      await axios.post(`${API}/admin/extend-grace-period`, {
                                        tenant_id: tenant.tenant_id,
                                        days: 7
                                      }, config);
                                      toast.success('Perioadă extinsă cu 7 zile!');
                                      fetchData();
                                    } catch (error) {
                                      console.error('Error extending period:', error);
                                      toast.error('Eroare la extindere');
                                    }
                                  }}
                                >
                                  +7 zile
                                </Button>
                                <Button 
                                  className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30"
                                  onClick={async () => {
                                    try {
                                      await axios.post(`${API}/admin/extend-grace-period`, {
                                        tenant_id: tenant.tenant_id,
                                        days: 14
                                      }, config);
                                      toast.success('Perioadă extinsă cu 14 zile!');
                                      fetchData();
                                    } catch (error) {
                                      console.error('Error extending period:', error);
                                      toast.error('Eroare la extindere');
                                    }
                                  }}
                                >
                                  +14 zile
                                </Button>
                                <Button 
                                  className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30"
                                  onClick={async () => {
                                    try {
                                      await axios.post(`${API}/admin/extend-grace-period`, {
                                        tenant_id: tenant.tenant_id,
                                        days: 30
                                      }, config);
                                      toast.success('Perioadă extinsă cu 30 zile!');
                                      fetchData();
                                    } catch (error) {
                                      console.error('Error extending period:', error);
                                      toast.error('Eroare la extindere');
                                    }
                                  }}
                                >
                                  +30 zile
                                </Button>
                                <Button 
                                  className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30"
                                  onClick={async () => {
                                    try {
                                      await axios.post(`${API}/admin/extend-grace-period`, {
                                        tenant_id: tenant.tenant_id,
                                        days: 90
                                      }, config);
                                      toast.success('Perioadă extinsă cu 90 zile!');
                                      fetchData();
                                    } catch (error) {
                                      console.error('Error extending period:', error);
                                      toast.error('Eroare la extindere');
                                    }
                                  }}
                                >
                                  +90 zile
                                </Button>
                              </div>
                              <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-400">
                                <p className="mb-2">Plan curent: <span className="text-white font-semibold">{tenant.subscription_plan || 'Trial'}</span></p>
                                <p>Expiră: <span className="text-white font-semibold">
                                  {tenant.subscription_end_date 
                                    ? new Date(tenant.subscription_end_date).toLocaleDateString('ro-RO')
                                    : 'N/A'}
                                </span></p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          size="sm" 
                          className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                          onClick={async () => {
                            try {
                              await axios.post(`${API}/admin/send-payment-notification`, {
                                tenant_id: tenant.tenant_id
                              }, config);
                              toast.success('Notificare de plată trimisă!');
                            } catch (error) {
                              console.error('Error sending notification:', error);
                              toast.error('Eroare la trimiterea notificării');
                            }
                          }}
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          Trimite Notificare Plată
                        </Button>

                        <Button 
                          size="sm" 
                          className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
                          onClick={async () => {
                            try {
                              await axios.post(`${API}/admin/reset-subscription-after-payment`, {
                                tenant_id: tenant.tenant_id,
                                months: 1
                              }, config);
                              toast.success('Abonament reînnoit pentru 1 lună! Toate notificările au fost șterse.');
                              fetchData(); // Refresh data
                            } catch (error) {
                              console.error('Error resetting subscription:', error);
                              toast.error('Eroare la reînnoirea abonamentului');
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmă Plată (1 lună)
                        </Button>

                        <Button 
                          size="sm" 
                          className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
                          onClick={() => handleViewEmployees(tenant)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Gestionare Utilizatori
                        </Button>
                      </div>
                  </div>
                ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Planuri de Abonament</CardTitle>
                <CardDescription className="text-slate-400">
                  Gestionează prețurile și caracteristicile planurilor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionPlans.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {subscriptionPlans.map((plan) => (
                      <Card key={plan.plan_id} className="bg-slate-800/50 border-white/5">
                        <CardHeader>
                          <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                          <div className="text-3xl font-bold text-cyan-400">
                            {plan.price} RON
                            <span className="text-slate-400 text-sm font-normal">/lună</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 mb-6">
                            {plan.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2 text-slate-300 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                {feature}
                              </div>
                            ))}
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30"
                                onClick={() => openEditPlan(plan)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editează Plan
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-700">
                              <DialogHeader>
                                <DialogTitle className="text-white">Editează Plan {plan.name}</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                  Modifică prețul și caracteristicile planului
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-slate-300">Preț (RON/lună)</Label>
                                  <Input
                                    type="number"
                                    value={editingPlan.price}
                                    onChange={(e) => setEditingPlan({...editingPlan, price: parseInt(e.target.value)})}
                                    className="bg-slate-800 border-slate-700 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-slate-300">Nume Plan</Label>
                                  <Input
                                    value={editingPlan.name}
                                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                                    className="bg-slate-800 border-slate-700 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-slate-300">Caracteristici (una pe linie)</Label>
                                  <Textarea
                                    value={editingPlan.features.join('\n')}
                                    onChange={(e) => setEditingPlan({...editingPlan, features: e.target.value.split('\n').filter(f => f.trim())})}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    rows={4}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-slate-300">Locații maxime</Label>
                                    <Input
                                      type="number"
                                      value={editingPlan.limits.locations}
                                      onChange={(e) => setEditingPlan({
                                        ...editingPlan, 
                                        limits: {...editingPlan.limits, locations: parseInt(e.target.value)}
                                      })}
                                      className="bg-slate-800 border-slate-700 text-white"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-slate-300">Angajați maximi</Label>
                                    <Input
                                      type="number"
                                      value={editingPlan.limits.employees}
                                      onChange={(e) => setEditingPlan({
                                        ...editingPlan, 
                                        limits: {...editingPlan.limits, employees: parseInt(e.target.value)}
                                      })}
                                      className="bg-slate-800 border-slate-700 text-white"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="has_ai"
                                    checked={editingPlan.limits.has_ai}
                                    onCheckedChange={(checked) => setEditingPlan({
                                      ...editingPlan, 
                                      limits: {...editingPlan.limits, has_ai: checked}
                                    })}
                                  />
                                  <Label htmlFor="has_ai" className="text-slate-300">AI Assistant inclus</Label>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  onClick={() => handleUpdatePlan(plan.plan_id)}
                                  className="bg-cyan-500 hover:bg-cyan-600"
                                  disabled={updatingPlan}
                                >
                                  {updatingPlan ? "Se salvează..." : "Salvează Modificări"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-slate-400">Se încarcă planurile...</div>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-6">
            <Card className="glass-effect border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Anunțuri Globale</CardTitle>
                  <CardDescription className="text-slate-400">
                    Creează și gestionează anunțuri pentru toți tenants
                  </CardDescription>
      </div>
                <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
                      <Bell className="w-4 h-4 mr-2" />
                      Anunț Nou
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Creează Anunț Nou</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Anunțul va fi vizibil pentru toți tenants activi
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Titlu</Label>
                        <Input
                          value={newAnnouncement.title}
                          onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                          placeholder="Ex: Actualizare sistem"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Mesaj</Label>
                        <Textarea
                          value={newAnnouncement.message}
                          onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                          placeholder="Mesajul anunțului..."
                          className="bg-slate-800 border-slate-700 text-white"
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Tip</Label>
                        <Select
                          value={newAnnouncement.type}
                          onValueChange={(value) => setNewAnnouncement({...newAnnouncement, type: value})}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="warning">Avertizare</SelectItem>
                            <SelectItem value="success">Succes</SelectItem>
                            <SelectItem value="error">Eroare</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-300">Data expirare (opțional)</Label>
                        <Input
                          type="datetime-local"
                          value={newAnnouncement.expires_at}
                          onChange={(e) => setNewAnnouncement({...newAnnouncement, expires_at: e.target.value})}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleCreateAnnouncement}
                        className="bg-cyan-500 hover:bg-cyan-600"
                        disabled={!newAnnouncement.title || !newAnnouncement.message}
                      >
                        Creează Anunț
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <Card key={announcement.announcement_id} className="bg-slate-800/50 border-white/5">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-white font-semibold">{announcement.title}</h3>
                                <Badge 
                                  className={`
                                    ${announcement.type === 'info' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}
                                    ${announcement.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : ''}
                                    ${announcement.type === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                                    ${announcement.type === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' : ''}
                                  `}
                                >
                                  {announcement.type}
                                </Badge>
                                <Badge 
                                  className={`${
                                    announcement.is_active 
                                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                  }`}
                                >
                                  {announcement.is_active ? 'Activ' : 'Inactiv'}
                                </Badge>
                              </div>
                              <p className="text-slate-300 text-sm mb-2">{announcement.message}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>Creat: {new Date(announcement.created_at).toLocaleDateString('ro-RO')}</span>
                                {announcement.expires_at && (
                                  <span>Expiră: {new Date(announcement.expires_at).toLocaleDateString('ro-RO')}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleAnnouncementActive(announcement)}
                                className={`${
                                  announcement.is_active 
                                    ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10' 
                                    : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                                }`}
                              >
                                {announcement.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteAnnouncement(announcement.announcement_id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Nu există anunțuri create</p>
                    <p className="text-slate-500 text-sm">Creează primul anunț pentru tenants</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Config Tab */}
          <TabsContent value="ai" className="space-y-6">
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-400" />
                  Configurare AI Global
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Gestionează API keys și configurări pentru AI Assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Google Gemini API Key</Label>
                    <Input
                      type="password"
                      value={aiConfig.api_key}
                      onChange={(e) => setAiConfig({ ...aiConfig, api_key: e.target.value })}
                      className="bg-slate-800/50 border-slate-700 text-white rounded-xl"
                      placeholder="AIzaSy..."
                    />
                    <p className="text-slate-400 text-xs mt-1">Această cheie va fi folosită de toți tenanții</p>
                  </div>

                  <div>
                    <Label className="text-slate-300">Model AI</Label>
                    <Select value={aiConfig.model} onValueChange={(value) => setAiConfig({ ...aiConfig, model: value })}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                        <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                        <SelectItem value="gemini-ultra">Gemini Ultra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
                    <input
                      type="checkbox"
                      checked={aiConfig.enabled}
                      onChange={(e) => setAiConfig({ ...aiConfig, enabled: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-cyan-500"
                    />
                    <div>
                      <p className="text-white font-medium">AI Activat Global</p>
                      <p className="text-slate-400 text-sm">Permite tenantilor să folosească AI Assistant</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
                    <h4 className="text-white font-medium">Statistici Utilizare AI</h4>
                    {aiStatsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <span className="ml-2 text-slate-400">Se încarcă statisticile...</span>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-slate-400 text-sm">Total API Calls (24h)</p>
                            <p className="text-white text-2xl font-bold">
                              {aiStats?.last_24h?.total_calls?.toLocaleString() || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Cost estimat (24h)</p>
                            <p className="text-white text-2xl font-bold">
                              ${aiStats?.last_24h?.total_cost?.toFixed(4) || '0.0000'}
                            </p>
                          </div>
                        </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700">
                      <div>
                        <p className="text-slate-400 text-sm">Total API Calls (All Time)</p>
                        <p className="text-white text-xl font-bold">
                          {aiStats?.all_time?.total_calls?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Cost Total (All Time)</p>
                        <p className="text-white text-xl font-bold">
                          ${aiStats?.all_time?.total_cost?.toFixed(4) || '0.0000'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Tenant Usage Breakdown */}
                    {aiStats?.tenant_usage && aiStats.tenant_usage.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <h5 className="text-white font-medium mb-3">Utilizare pe Tenant (24h)</h5>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {aiStats.tenant_usage.map((tenant, index) => (
                            <div key={index} className="flex justify-between items-center bg-slate-700/30 rounded-lg p-2">
                              <div>
                                <p className="text-white text-sm font-medium">{tenant.tenant_name || `Tenant ${tenant.tenant_id}`}</p>
                                <p className="text-slate-400 text-xs">{tenant.total_calls} calls</p>
                              </div>
                              <div className="text-right">
                                <p className="text-green-400 text-sm font-medium">${tenant.total_cost?.toFixed(4) || '0.0000'}</p>
                                <p className="text-slate-400 text-xs">{tenant.total_tokens?.toLocaleString() || 0} tokens</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                      </>
                    )}
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                    onClick={handleUpdateAIConfig}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Salvează Configurare AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Server Tab */}
          <TabsContent value="server" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-cyan-400" />
                    Informații Server
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {serverInfo ? (
                    <>
                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Cpu className="w-5 h-5 text-cyan-400" />
                          <div>
                            <p className="text-slate-400 text-sm">CPU Usage</p>
                            <p className="text-white font-bold">{serverInfo.cpu_usage?.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="w-20 h-20 rounded-full border-4 border-cyan-500/30 flex items-center justify-center">
                          <span className="text-cyan-400 font-bold">{serverInfo.cpu_usage?.toFixed(0)}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <HardDrive className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-slate-400 text-sm">RAM Usage</p>
                            <p className="text-white font-bold">
                              {(serverInfo.memory_used / (1024**3)).toFixed(1)} GB / {(serverInfo.memory_total / (1024**3)).toFixed(0)} GB
                            </p>
                          </div>
                        </div>
                        <div className="w-20 h-20 rounded-full border-4 border-blue-500/30 flex items-center justify-center">
                          <span className="text-blue-400 font-bold">{serverInfo.memory_percent?.toFixed(0)}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Database className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-slate-400 text-sm">Disk Usage</p>
                            <p className="text-white font-bold">
                              {(serverInfo.disk_used / (1024**3)).toFixed(0)} GB / {(serverInfo.disk_total / (1024**3)).toFixed(0)} GB
                            </p>
                          </div>
                        </div>
                        <div className="w-20 h-20 rounded-full border-4 border-green-500/30 flex items-center justify-center">
                          <span className="text-green-400 font-bold">{serverInfo.disk_percent?.toFixed(0)}%</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-slate-400">Se încarcă informațiile serverului...</div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    Status & Acțiuni
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {serverInfo ? (
                    <>
                      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                          <p className="text-green-400 font-bold">Server Online</p>
                        </div>
                        <p className="text-slate-300 text-sm">Uptime: {serverInfo.uptime_formatted}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-slate-400 text-sm font-medium">Python Version</p>
                        <p className="text-white">{serverInfo.python_version}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-slate-400 text-sm font-medium">Database</p>
                        <p className="text-white">MongoDB {serverInfo.mongo_version}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-slate-400 text-sm font-medium">Last Restart</p>
                        <p className="text-white">
                          {new Date(serverInfo.server_start_time).toLocaleString('ro-RO')}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-slate-400">Se încarcă...</div>
                  )}

                  <div className="pt-4 space-y-2">
                    <Button 
                      className="w-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                      onClick={handleRestartServer}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Restart Server
                    </Button>
                    <p className="text-slate-400 text-xs text-center">
                      ⚠️ Va opri temporar toate serviciile
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup" className="space-y-6">
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  Gestionare Backup
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Creează și gestionează backup-uri ale bazei de date
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-800/50 rounded-xl border border-white/5">
                    <Database className="w-10 h-10 text-cyan-400 mb-4" />
                    <h3 className="text-white font-bold text-lg mb-2">Backup Complet</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Include toate datele: tenants, utilizatori, fișe service, setări
                    </p>
                          <Button
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      onClick={handleCreateBackup}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Creează Backup
                    </Button>
                    </div>

                  <div className="p-6 bg-slate-800/50 rounded-xl border border-white/5">
                    <Shield className="w-10 h-10 text-purple-400 mb-4" />
                    <h3 className="text-white font-bold text-lg mb-2">Protecție Date</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Backup-urile sunt comprimate în format ZIP și includ toate colecțiile
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Tenants & Utilizatori</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Fișe Service & Tickete</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Setări & Configurări</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Backup Incremental</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-semibold">Backup-uri Disponibile</h4>
                    <Button
                      size="sm"
                      onClick={handleCreateBackup}
                      disabled={creatingBackup}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500"
                    >
                      {creatingBackup ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Se creează...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Backup Nou
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {backups.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nu există backup-uri create</p>
                      <p className="text-sm mt-1">Creează primul backup pentru a proteja datele</p>
                    </div>
                  ) : (
                    backups.map((backup) => (
                      <div key={backup.backup_id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="w-5 h-5 text-cyan-400" />
                          <div className="flex-1">
                            <p className="text-white font-medium">{backup.filename}</p>
                            <p className="text-slate-400 text-sm">
                              {backup.size_mb} MB • {backup.file_count} fișiere • {new Date(backup.created_at).toLocaleString('ro-RO')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleDownloadBackup(backup.backup_id, backup.filename)}
                            className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRestoreBackup(backup.backup_id)}
                            disabled={restoringBackup}
                            className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                          >
                            <RefreshCw className={`w-4 h-4 ${restoringBackup ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDeleteBackup(backup.backup_id)}
                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
              </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            {/* Stats Cards */}
            {logsStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass-effect border-white/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Total Logs</p>
                        <p className="text-3xl font-bold text-white mt-1">{logsStats.total_logs}</p>
                      </div>
                      <FileText className="w-10 h-10 text-cyan-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="glass-effect border-white/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Erori (24h)</p>
                        <p className="text-3xl font-bold text-red-400 mt-1">{logsStats.recent_errors_24h}</p>
                      </div>
                      <AlertTriangle className="w-10 h-10 text-red-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="glass-effect border-white/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Warnings</p>
                        <p className="text-3xl font-bold text-amber-400 mt-1">{logsStats.level_stats?.warning || 0}</p>
                      </div>
                      <AlertTriangle className="w-10 h-10 text-amber-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="glass-effect border-white/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Info</p>
                        <p className="text-3xl font-bold text-blue-400 mt-1">{logsStats.level_stats?.info || 0}</p>
                      </div>
                      <CheckCircle className="w-10 h-10 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            <Card className="glass-effect border-white/10">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-slate-300">Type</Label>
                    <Select value={logsFilter.log_type || 'all'} onValueChange={(value) => setLogsFilter({...logsFilter, log_type: value === 'all' ? '' : value})}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder="Toate" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">Toate</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="activity">Activity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300">Level</Label>
                    <Select value={logsFilter.level || 'all'} onValueChange={(value) => setLogsFilter({...logsFilter, level: value === 'all' ? '' : value})}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder="Toate" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">Toate</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300">Category</Label>
                    <Select value={logsFilter.category || 'all'} onValueChange={(value) => setLogsFilter({...logsFilter, category: value === 'all' ? '' : value})}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder="Toate" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">Toate</SelectItem>
                        <SelectItem value="auth">Auth</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="user_action">User Action</SelectItem>
                        <SelectItem value="settings">Settings</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end gap-2">
                    <Button onClick={fetchData} className="flex-1 bg-cyan-500 hover:bg-cyan-600">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Button 
                      onClick={async () => {
                        if (!window.confirm('⚠️ Șterge TOATE log-urile? Această acțiune NU poate fi anulată!')) return;
                        try {
                          await axios.delete(`${API}/admin/logs?older_than_days=0`, config);
                          toast.success('Toate log-urile au fost șterse!');
                          fetchData();
                        } catch (error) {
                          console.error('Error clearing logs:', error);
                          toast.error('Eroare la ștergerea log-urilor');
                        }
                      }}
                      className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Logs ({logsTotalCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nu există log-uri</p>
                      <p className="text-sm mt-2">Log-urile vor apărea aici automat</p>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.log_id}
                        className={`p-4 rounded-lg border ${
                          log.level === 'critical' ? 'bg-purple-500/10 border-purple-500/30' :
                          log.level === 'error' ? 'bg-red-500/10 border-red-500/30' :
                          log.level === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                          'bg-slate-800/50 border-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`${
                                log.level === 'critical' ? 'bg-purple-500/20 text-purple-400' :
                                log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                                log.level === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {log.level.toUpperCase()}
                              </Badge>
                              <Badge className="bg-slate-700 text-slate-300">
                                {log.category}
                              </Badge>
                              <Badge className={`${
                                log.log_type === 'system' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {log.log_type}
                              </Badge>
                            </div>
                            <p className="text-white font-medium mb-1">{log.message}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              {log.user_email && (
                                <span>👤 {log.user_email}</span>
                              )}
                              {log.ip_address && (
                                <span>📍 {log.ip_address}</span>
                              )}
                              <span>🕒 {new Date(log.created_at).toLocaleString('ro-RO')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {logsTotalCount > logsLimit && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <p className="text-slate-400 text-sm">
                      Afișare {logsPage * logsLimit + 1} - {Math.min((logsPage + 1) * logsLimit, logsTotalCount)} din {logsTotalCount}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => { setLogsPage(logsPage - 1); fetchData(); }}
                        disabled={logsPage === 0}
                        className="bg-slate-700 hover:bg-slate-600"
                      >
                        Anterior
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => { setLogsPage(logsPage + 1); fetchData(); }}
                        disabled={(logsPage + 1) * logsLimit >= logsTotalCount}
                        className="bg-slate-700 hover:bg-slate-600"
                      >
                        Următorul
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Setări Platformă
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configurare globală a platformei FixGSM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-white font-medium">Maintenance Mode</h4>
                        <p className="text-slate-400 text-sm">Blochează accesul utilizatorilor temporar</p>
                      </div>
                      <Checkbox
                        checked={platformSettings.maintenance_mode}
                        onCheckedChange={(checked) => setPlatformSettings({...platformSettings, maintenance_mode: checked})}
                        className="w-5 h-5"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-white font-medium">Auto-approve Tenants</h4>
                        <p className="text-slate-400 text-sm">Activează automat tenanții noi</p>
                      </div>
                      <Checkbox
                        checked={platformSettings.auto_approve_tenants}
                        onCheckedChange={(checked) => setPlatformSettings({...platformSettings, auto_approve_tenants: checked})}
                        className="w-5 h-5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Email Notificări</Label>
                    <Input
                      type="email"
                      value={platformSettings.notification_email}
                      onChange={(e) => setPlatformSettings({...platformSettings, notification_email: e.target.value})}
                      placeholder="admin@fixgsm.com"
                      className="bg-slate-800/50 border-slate-700 text-white rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Landing Page URL</Label>
                    <Input
                      value={platformSettings.landing_page_url}
                      onChange={(e) => setPlatformSettings({...platformSettings, landing_page_url: e.target.value})}
                      placeholder="https://fixgsm.ro"
                      className="bg-slate-800/50 border-slate-700 text-white rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Support Email</Label>
                    <Input
                      type="email"
                      value={platformSettings.support_email}
                      onChange={(e) => setPlatformSettings({...platformSettings, support_email: e.target.value})}
                      placeholder="support@fixgsm.ro"
                      className="bg-slate-800/50 border-slate-700 text-white rounded-xl"
                    />
                  </div>

                  {platformSettings.maintenance_mode && (
                    <div className="space-y-2 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                      <Label className="text-orange-300 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Timp Estimat Mentenanță
                      </Label>
                      <Input
                        value={platformSettings.estimated_maintenance_time}
                        onChange={(e) => setPlatformSettings({...platformSettings, estimated_maintenance_time: e.target.value})}
                        placeholder="ex: 2 ore, 30 minute, etc."
                        className="bg-slate-800/50 border-slate-700 text-white rounded-xl"
                      />
                      <p className="text-slate-400 text-xs">
                        Acest mesaj va fi afișat utilizatorilor pe pagina de mentenanță
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {savingSettings ? 'Se salvează...' : 'Salvează Setări'}
                  </Button>
                </div>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Employees Dialog */}
      <Dialog open={viewEmployeesDialog} onOpenChange={setViewEmployeesDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>Utilizatori - {selectedTenant?.service_name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Gestionează utilizatorii pentru acest tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[500px] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <p className="text-slate-400 text-sm">
                Total: <span className="text-white font-semibold">{tenantEmployees.length}</span> utilizatori
              </p>
              <Dialog open={addEmployeeDialog} onOpenChange={setAddEmployeeDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
                    <Users className="w-4 h-4 mr-2" />
                    Adaugă Utilizator
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
                  <DialogHeader>
                    <DialogTitle>Utilizator Nou</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Adaugă un utilizator pentru {selectedTenant?.service_name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-slate-300">Nume</Label>
                      <Input
                        value={newEmployeeData.name}
                        onChange={(e) => setNewEmployeeData({...newEmployeeData, name: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Ion Popescu"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Email</Label>
                      <Input
                        type="email"
                        value={newEmployeeData.email}
                        onChange={(e) => setNewEmployeeData({...newEmployeeData, email: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="ion@example.com"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Parolă</Label>
                      <Input
                        type="password"
                        value={newEmployeeData.password}
                        onChange={(e) => setNewEmployeeData({...newEmployeeData, password: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Minim 8 caractere"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Rol</Label>
                      <Select
                        value={newEmployeeData.role}
                        onValueChange={(value) => setNewEmployeeData({...newEmployeeData, role: value})}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="Receptie">Recepție</SelectItem>
                          <SelectItem value="Technician">Tehnician</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Locație</Label>
                      <Select
                        value={newEmployeeData.location_id}
                        onValueChange={(value) => setNewEmployeeData({...newEmployeeData, location_id: value})}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Selectează locația" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {tenantLocations.map((location) => (
                            <SelectItem key={location.location_id} value={location.location_id}>
                              {location.name} - {location.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      onClick={handleAddEmployee}
                      disabled={!newEmployeeData.name || !newEmployeeData.email || newEmployeeData.password.length < 8 || !newEmployeeData.location_id}
                    >
                      Adaugă Utilizator
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {tenantEmployees.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nu există utilizatori</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tenantEmployees.map((employee) => (
                  <div key={employee.user_id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{employee.name}</p>
                          <p className="text-slate-400 text-sm">{employee.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          {employee.role}
                        </Badge>
                        {employee.created_by_admin && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            <Shield className="w-3 h-3 mr-1" />
                            Creat de Admin
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleDeleteEmployee(employee.user_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

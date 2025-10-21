import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, DollarSign, TrendingUp, Clock, Plus, Search, Smartphone, User, Phone, Cpu, Shield, AlertTriangle, Wrench, Eye, Palette, Zap, MapPin, ChevronDown, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';
import PaymentAlert from '@/components/PaymentAlert';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { useLanguage } from '@/contexts/LanguageContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ServiceDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    device_model: '',
    imei: '',
    visual_aspect: '',
    reported_issue: '',
    service_operations: '',
    access_code: '',
    colors: '',
    defect_cause: '',
    observations: '',
    estimated_cost: 0,
    urgent: false,
    location_id: ''
  });
  const [clientSearchResults, setClientSearchResults] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const [openActionsDropdown, setOpenActionsDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, openUp: false });
  const [actionsDropdownPosition, setActionsDropdownPosition] = useState({ top: 0, left: 0 });
  const statusDropdownRef = useRef(null);
  const actionsDropdownRef = useRef(null);

  const token = localStorage.getItem('fixgsm_token');
  const userName = localStorage.getItem('fixgsm_name');
  const userType = localStorage.getItem('fixgsm_user_type');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchData();
  }, [selectedLocation]);
  // Reset pagination when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedLocation]);

  useEffect(() => {
    const handleCreateTicket = () => {
      setDialogOpen(true);
    };

    window.addEventListener('createTicket', handleCreateTicket);
    return () => window.removeEventListener('createTicket', handleCreateTicket);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showClientDropdown && !event.target.closest('.client-search-container')) {
        setShowClientDropdown(false);
        setClientSearchResults([]);
      }
      if (openStatusDropdown && statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setOpenStatusDropdown(null);
      }
      if (openActionsDropdown && actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target)) {
        setOpenActionsDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClientDropdown, openStatusDropdown, openActionsDropdown]);

  const fetchData = async () => {
    try {
      const locationParam = selectedLocation !== 'all' ? `?location_id=${selectedLocation}` : '';
      const [statsRes, ticketsRes, locationsRes, statusesRes] = await Promise.all([
        axios.get(`${API}/tenant/dashboard-stats`, config),
        axios.get(`${API}/tickets${locationParam}`, config),
        axios.get(`${API}/tenant/locations`, config),
        axios.get(`${API}/tenant/custom-statuses`, config)
      ]);
      setStats(statsRes.data);
      setTickets(ticketsRes.data);
      setLocations(locationsRes.data);
      setStatuses(statusesRes.data.statuses || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  // Client search functionality
  const searchClients = async (query) => {
    console.log('DEBUG: Searching clients for query:', query);
    if (query.length < 2) {
      console.log('DEBUG: Query too short, hiding dropdown');
      setClientSearchResults([]);
      setShowClientDropdown(false);
      return;
    }

    try {
      console.log('DEBUG: Making API call to search clients');
      const response = await axios.get(`${API}/tenant/clients/search?query=${encodeURIComponent(query)}`, config);
      console.log('DEBUG: Search results:', response.data);
      setClientSearchResults(response.data);
      setShowClientDropdown(true);
    } catch (error) {
      console.error('Error searching clients:', error);
      setClientSearchResults([]);
      setShowClientDropdown(false);
    }
  };

  const selectClient = (client) => {
    setSelectedClient(client);
    setFormData({
      ...formData,
      client_name: client.name,
      client_phone: client.phone
    });
    setShowClientDropdown(false);
    setClientSearchResults([]);
  };

  const handleClientNameChange = (e) => {
    const value = e.target.value;
    console.log('DEBUG: Client name changed to:', value);
    setFormData({ ...formData, client_name: value });
    
    // Clear selected client if user is typing
    if (selectedClient && selectedClient.name !== value) {
      setSelectedClient(null);
    }
    
    // Search for clients
    searchClients(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tickets`, formData, config);
      toast.success('Fișă creată cu succes!');
      setDialogOpen(false);
      setFormData({
        client_name: '',
        client_phone: '',
        device_model: '',
        imei: '',
        visual_aspect: '',
        reported_issue: '',
        service_operations: '',
        access_code: '',
        colors: '',
        defect_cause: '',
        observations: '',
        estimated_cost: 0,
        urgent: false,
        location_id: ''
      });
      setSelectedClient(null);
      setClientSearchResults([]);
      setShowClientDropdown(false);
      fetchData();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Eroare la crearea fișei');
    }
  };

  const getStatusColor = (status) => {
    const statusObj = statuses.find(s => s.label === status);
    return statusObj?.color || '#64748b';
  };

  const getStatusIcon = (status) => {
    const statusObj = statuses.find(s => s.label === status);
    return statusObj?.icon || '📋';
  };

  const handleStatusChange = async (ticketId, newStatus, event) => {
    event.stopPropagation();
    try {
      await axios.put(`${API}/tickets/${ticketId}`, { status: newStatus }, config);
      toast.success(`Status actualizat la "${newStatus}"`);
      fetchData();
      setOpenStatusDropdown(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Eroare la actualizarea statusului');
    }
  };

  const toggleStatusDropdown = (ticketId, event) => {
    event.stopPropagation();
    
    if (openStatusDropdown === ticketId) {
      setOpenStatusDropdown(null);
      return;
    }
    
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const dropdownHeight = 400; // max-height
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Decide if dropdown should open upwards
    const shouldOpenUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    
    setDropdownPosition({
      top: shouldOpenUp ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
      left: rect.left,
      openUp: shouldOpenUp
    });
    
    setOpenStatusDropdown(ticketId);
  };

  const toggleActionsDropdown = (ticketId, event) => {
    event.stopPropagation();
    
    if (openActionsDropdown === ticketId) {
      setOpenActionsDropdown(null);
      return;
    }
    
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const dropdownWidth = 256; // w-64 = 16rem = 256px
    const dropdownHeight = 180;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.right;
    
    const shouldOpenUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    
    // Calculate left position: if not enough space on the right, align to the right edge of button
    let leftPosition = rect.left;
    if (spaceRight < dropdownWidth) {
      // Align dropdown to the right edge of the button
      leftPosition = rect.right - dropdownWidth;
    }
    
    setActionsDropdownPosition({
      top: shouldOpenUp ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
      left: leftPosition
    });
    
    setOpenActionsDropdown(ticketId);
  };

  const handlePrintDocument = async (ticketId, docType, event) => {
    event.stopPropagation();
    setOpenActionsDropdown(null);
    
    try {
      const response = await axios.get(
        `${API}/tenant/tickets/${ticketId}/pdf/${docType}`,
        {
          ...config,
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docType}_${ticketId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Document descărcat cu succes!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Eroare la descărcarea documentului');
    }
  };

  // Group statuses by category
  const statusesByCategory = statuses.reduce((acc, status) => {
    const category = status.category || 'OTHER';
    if (!acc[category]) acc[category] = [];
    acc[category].push(status);
    return acc;
  }, {});

  const getCategoryLabel = (category) => {
    const labels = {
      'NOU': '📥 NOU',
      'INLUCRU': '🔧 ÎN LUCRU',
      'INASTEPTARE': '⏳ ÎN AȘTEPTARE',
      'FINALIZAT': '🎉 FINALIZAT',
      'CASTIGAT': '💰 CÂȘTIGAT',
      'PIERDUT': '❌ PIERDUT',
      'CURIER': '🚚 CURIER'
    };
    return labels[category] || category;
  };

  const filteredTickets = tickets.filter(ticket => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ticket.ticket_id.toLowerCase().includes(searchLower) ||
      ticket.client_name.toLowerCase().includes(searchLower) ||
      ticket.device_model.toLowerCase().includes(searchLower) ||
      ticket.client_phone.includes(searchTerm)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleTickets = filteredTickets.slice(startIndex, startIndex + PAGE_SIZE);
  const formatLei = (value) => new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
  const toText = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') {
      if (typeof value.msg === 'string') return value.msg;
      if (typeof value.label === 'string') return value.label;
      return '-';
    }
    return String(value);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-xl">Se încarcă...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Payment Alert */}
        <PaymentAlert />

        {/* Announcements */}
        <AnnouncementBanner />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="glass-effect rounded-3xl border border-white/10 shadow-2xl shadow-black/20 hover:shadow-cyan-500/10 transition-all duration-300 hover:transform hover:scale-105" data-testid="total-tickets-card">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{t('dashboard.totalTickets')}</p>
                  <p className="text-4xl font-bold text-white mt-3 font-['Space_Grotesk']">{stats?.total_tickets || 0}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect rounded-3xl border border-white/10 shadow-2xl shadow-black/20 hover:shadow-blue-500/10 transition-all duration-300 hover:transform hover:scale-105" data-testid="total-revenue-card">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{t('dashboard.revenue')}</p>
                  <p className="text-4xl font-bold gradient-text mt-3 font-['Space_Grotesk']">{stats?.total_cost || 0} LEI</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect rounded-3xl border border-white/10 shadow-2xl shadow-black/20 hover:shadow-cyan-500/10 transition-all duration-300 hover:transform hover:scale-105" data-testid="in-progress-card">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{t('dashboard.inProgress')}</p>
                  <p className="text-4xl font-bold text-cyan-400 mt-3 font-['Space_Grotesk']">
                    {Object.values(stats?.by_status || {}).reduce((acc, curr) => {
                      if (curr.status && curr.status.toLowerCase().includes('lucru')) {
                        return acc + curr.count;
                      }
                      return acc;
                    }, 0)}
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect rounded-3xl border border-white/10 shadow-2xl shadow-black/20 hover:shadow-amber-500/10 transition-all duration-300 hover:transform hover:scale-105" data-testid="pending-card">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{t('dashboard.pending')}</p>
                  <p className="text-4xl font-bold text-amber-400 mt-3 font-['Space_Grotesk']">
                    {Object.values(stats?.by_status || {}).reduce((acc, curr) => {
                      if (curr.status && curr.status.toLowerCase().includes('asteptare')) {
                        return acc + curr.count;
                      }
                      return acc;
                    }, 0)}
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-effect rounded-3xl border border-white/10 shadow-2xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder={t('dashboard.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white pl-12 h-12 rounded-xl focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-300"
                    data-testid="search-input"
                  />
                </div>
              </div>
              {userType === 'tenant_owner' && (
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white w-full md:w-64 h-12 pl-12 rounded-xl focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-300" data-testid="location-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                      <SelectItem value="all" className="text-white">{t('dashboard.allLocations')}</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.location_id} value={location.location_id} className="text-white">
                          {location.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl h-12 px-6"
                    data-testid="new-ticket-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('dashboard.newTicket')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-effect border border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
                  <DialogHeader className="p-8 pb-6">
                    <DialogTitle className="text-3xl font-bold gradient-text font-['Space_Grotesk']">Fișă Service - Tichet Service Nou</DialogTitle>
                    <DialogDescription className="text-xl text-slate-400 mt-2">
                      Completează detaliile pentru noua reparație
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-8 px-8 pb-8">
                    {/* Client Section */}
                    <div className="glass-effect rounded-2xl p-6 border border-white/10">
                      <h3 className="text-xl font-semibold text-cyan-400 flex items-center mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-cyan-500/25">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        Client
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-slate-300 font-medium">Caută sau adaugă client</Label>
                          <div className="relative client-search-container">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                              value={formData.client_name}
                              onChange={handleClientNameChange}
                              required
                              placeholder="Nume client"
                              className="bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 pl-10 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-300"
                              data-testid="client-name-input"
                            />
                            {/* Client Search Dropdown */}
                            {showClientDropdown && clientSearchResults.length > 0 && (
                              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                {clientSearchResults.map((client) => (
                                  <div
                                    key={client.client_id}
                                    onClick={() => selectClient(client)}
                                    className="px-4 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-b-0"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-white font-medium">{client.name}</div>
                                        <div className="text-slate-400 text-sm">{client.phone}</div>
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {client.created_at ? new Date(client.created_at).toLocaleDateString('ro-RO') : 'N/A'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* No results message */}
                            {showClientDropdown && clientSearchResults.length === 0 && formData.client_name.length >= 2 && (
                              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-4">
                                <div className="text-slate-400 text-center">
                                  Nu s-au găsit clienți. Se va crea un client nou.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-300 font-medium">Număr Telefon</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                              value={formData.client_phone}
                              onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                              required
                              placeholder="0712345678"
                              className="bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 pl-10 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-300"
                              data-testid="client-phone-input"
                            />
                          </div>
                        </div>
                      </div>
                      {/* Selected Client Info */}
                      {selectedClient && (
                        <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                          <div className="flex items-center gap-2 text-cyan-400">
                            <User className="w-4 h-4" />
                            <span className="font-medium">Client selectat:</span>
                          </div>
                          <div className="text-white mt-1">
                            {selectedClient.name} - {selectedClient.phone}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Device Info Section */}
                    <div className="glass-effect rounded-2xl p-6 border border-white/10">
                      <h3 className="text-xl font-semibold text-blue-400 flex items-center mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-500/25">
                          <Smartphone className="w-5 h-5 text-white" />
                        </div>
                        Informații Dispozitiv
                      </h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-slate-300 font-medium">Model</Label>
                          <div className="relative">
                            <Cpu className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                              value={formData.device_model}
                              onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                              required
                              placeholder="Samsung S20"
                              className="bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 pl-10 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                              data-testid="device-model-input"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-300 font-medium">IMEI / SN</Label>
                          <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <Input
                                value={formData.imei}
                                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                                placeholder="IMEI"
                                className="bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 pl-10 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                                data-testid="imei-input"
                              />
                            </div>
                            <Button type="button" size="sm" variant="outline" className="border-slate-700 rounded-xl h-12 px-4">
                              <Search className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-300 font-medium">Aspect vizual</Label>
                          <div className="relative">
                            <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                              value={formData.visual_aspect}
                              onChange={(e) => setFormData({ ...formData, visual_aspect: e.target.value })}
                              placeholder="Stare dispozitiv"
                              className="bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 pl-10 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                              data-testid="visual-aspect-input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Service Details */}
                    <div className="glass-effect rounded-2xl p-6 border border-white/10">
                      <h3 className="text-xl font-semibold text-emerald-400 flex items-center mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-emerald-500/25">
                          <Wrench className="w-5 h-5 text-white" />
                        </div>
                        Detalii Service
                      </h3>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <Label className="text-slate-300 font-medium flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2 text-emerald-400" />
                            Defecte reclamate
                          </Label>
                          <Textarea
                            value={formData.reported_issue}
                            onChange={(e) => setFormData({ ...formData, reported_issue: e.target.value })}
                            required
                            placeholder="Descrie problema"
                            className="bg-slate-800/50 border-slate-700 text-white rounded-xl focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300"
                            rows={3}
                            data-testid="reported-issue-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-300 font-medium flex items-center">
                            <Wrench className="w-4 h-4 mr-2 text-emerald-400" />
                            Operațiuni service
                          </Label>
                          <Textarea
                            value={formData.service_operations}
                            onChange={(e) => setFormData({ ...formData, service_operations: e.target.value })}
                            placeholder="Ce urmează să faci"
                            className="bg-slate-800/50 border-slate-700 text-white rounded-xl focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300"
                            rows={3}
                            data-testid="service-operations-input"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-slate-300 font-medium">Cod Acces</Label>
                          <div className="relative">
                            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                              value={formData.access_code}
                              onChange={(e) => setFormData({ ...formData, access_code: e.target.value })}
                              placeholder="PIN/Parolă"
                              className="bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 pl-10 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300"
                              data-testid="access-code-input"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-300 font-medium">Culoare</Label>
                          <div className="relative">
                            <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                              value={formData.colors}
                              onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                              placeholder="Culoare dispozitiv"
                              className="bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 pl-10 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300"
                              data-testid="colors-input"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-300 font-medium">Cauza de defectare</Label>
                          <div className="relative">
                            <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                              value={formData.defect_cause}
                              onChange={(e) => setFormData({ ...formData, defect_cause: e.target.value })}
                              placeholder="Ex: cădere"
                              className="bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 pl-10 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300"
                              data-testid="defect-cause-input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="glass-effect rounded-2xl p-6 border border-white/10">
                      <h3 className="text-xl font-semibold text-purple-400 flex items-center mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-purple-500/25">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        Informații Suplimentare
                      </h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-slate-300 font-medium flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-purple-400" />
                            Observații
                          </Label>
                          <Textarea
                            value={formData.observations}
                            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                            placeholder="Observații suplimentare"
                            className="bg-slate-800/50 border-slate-700 text-white rounded-xl focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
                            rows={3}
                            data-testid="observations-input"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-slate-300 font-medium">Cost estimat</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <Input
                                type="number"
                                value={formData.estimated_cost}
                                onChange={(e) => setFormData({ ...formData, estimated_cost: Number(e.target.value) })}
                                placeholder="0"
                                className="bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
                                data-testid="estimated-cost-input"
                              />
                    </div>
                  </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300 font-medium">Locație</Label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                              <Select value={formData.location_id} onValueChange={(value) => setFormData({ ...formData, location_id: value })}>
                                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 pl-10 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300" data-testid="location-select">
                                  <SelectValue placeholder="Selectează locația" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                                  {locations.map((location) => (
                                    <SelectItem key={location.location_id} value={location.location_id} className="text-white">
                                      {location.location_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="urgent"
                              checked={formData.urgent}
                              onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
                              className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500/20"
                              data-testid="urgent-checkbox"
                            />
                            <Label htmlFor="urgent" className="text-slate-300 font-medium flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" />
                              Urgent
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-slate-700 text-white hover:bg-slate-800/50 rounded-xl h-12 transition-all duration-300"
                        onClick={() => setDialogOpen(false)}
                        data-testid="cancel-btn"
                      >
                        Anulează
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl h-12 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25"
                        disabled={!formData.location_id}
                        data-testid="submit-ticket-btn"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Salvează Fișa
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
          </CardContent>
        </Card>

        {/* Status Dropdown Portal */}
        {openStatusDropdown && (
          <div 
            ref={statusDropdownRef}
            className="fixed z-[9999] w-64 glass-effect rounded-xl border border-white/10 shadow-2xl max-h-[400px] overflow-y-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`
            }}
          >
            {Object.entries(statusesByCategory).map(([category, categoryStatuses]) => (
              <div key={category} className="p-2">
                <div className="text-xs font-semibold text-slate-400 px-2 py-1.5 uppercase tracking-wider">
                  {getCategoryLabel(category)}
                </div>
                <div className="space-y-0.5">
                  {categoryStatuses.map((status) => (
                    <button
                      key={status.status_id || status.label}
                      onClick={(e) => handleStatusChange(openStatusDropdown, status.label, e)}
                      className="w-full text-left px-2 py-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                        style={{ backgroundColor: `${status.color}30` }}
                      >
                        {status.icon || '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm">{status.label}</div>
                        {status.description && (
                          <div className="text-slate-400 text-xs truncate">{status.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions Dropdown Portal */}
        {openActionsDropdown && (
          <div 
            ref={actionsDropdownRef}
            className="fixed z-[9999] w-64 glass-effect rounded-xl border border-white/10 shadow-2xl"
            style={{
              top: `${actionsDropdownPosition.top}px`,
              left: `${actionsDropdownPosition.left}px`
            }}
          >
            <div className="p-2">
              <div className="text-xs font-semibold text-white px-3 py-2 uppercase tracking-wider border-b border-white/10 flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Imprimare Document
              </div>
              <div className="space-y-1 pt-2">
                <button
                  onClick={(e) => handlePrintDocument(openActionsDropdown, 'reception', e)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-base flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                    <FileText className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm">Fișă Recepție</div>
                    <div className="text-slate-400 text-xs">Document de primire client</div>
                  </div>
                </button>
                
                
                <button
                  onClick={(e) => handlePrintDocument(openActionsDropdown, 'warranty', e)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-base flex-shrink-0 group-hover:bg-green-500/30 transition-colors">
                    <Shield className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm">Fișă Ieșire + Garanție</div>
                    <div className="text-slate-400 text-xs">Cu certificat de garanție</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tickets Table */}
        {filteredTickets.length === 0 ? (
          <Card className="glass-effect rounded-3xl border border-white/10 shadow-2xl shadow-black/20">
            <CardContent className="py-16 text-center text-slate-400 text-xl" data-testid="no-tickets">
              {searchTerm ? 'Nu s-au găsit fișe' : 'Nu există fișe de service. Creează prima fișă!'}
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-effect rounded-3xl border border-white/10 shadow-2xl shadow-black/20">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">#</th>
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">{t('tickets.device')}</th>
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">{t('tickets.defects')}</th>
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">{t('tickets.operations')}</th>
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">{t('tickets.client')}</th>
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">{t('tickets.cost')}</th>
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">{t('tickets.status')}</th>
                      <th className="text-left p-4 text-slate-400 font-semibold text-sm">{t('tickets.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTickets.map((ticket) => (
                      <tr
                        key={ticket.ticket_id}
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all duration-300"
                        onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                        data-testid={`ticket-row-${ticket.ticket_id}`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Smartphone className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-white font-semibold text-sm">{ticket.ticket_id}</div>
                              <div className="text-slate-400 text-xs">{new Date(ticket.created_at).toLocaleDateString('ro-RO')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-white font-medium text-sm">{ticket.device_model}</div>
                          <div className="text-slate-400 text-xs">IMEI: {ticket.imei || '-'}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-300 text-sm line-clamp-2">{toText(ticket.reported_issue)}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-300 text-sm line-clamp-2">{toText(ticket.service_operations) || '-'}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-white font-medium text-sm">{toText(ticket.client_name)}</div>
                          <div className="text-slate-400 text-xs">{toText(ticket.client_phone)}</div>
                        </td>
                        <td className="p-4">
                          {ticket.estimated_cost !== undefined && ticket.estimated_cost !== null && ticket.estimated_cost !== '' && typeof ticket.estimated_cost !== 'object' ? (
                            <div className="text-white font-semibold text-sm whitespace-nowrap">{formatLei(Number(ticket.estimated_cost))} LEI</div>
                          ) : (
                            <div className="text-slate-400 text-sm">-</div>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            data-ticket-id={ticket.ticket_id}
                            onClick={(e) => toggleStatusDropdown(ticket.ticket_id, e)}
                            className="inline-flex items-center gap-1.5 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 whitespace-nowrap"
                            style={{ backgroundColor: getStatusColor(ticket.status) }}
                          >
                            <span className="text-sm">{getStatusIcon(ticket.status)}</span>
                            <span className="truncate max-w-[80px]">{ticket.status}</span>
                            <ChevronDown className="w-3 h-3 opacity-70 flex-shrink-0" />
                          </button>
                        </td>
                        <td className="p-4">
                          <button
                            data-actions-id={ticket.ticket_id}
                            onClick={(e) => toggleActionsDropdown(ticket.ticket_id, e)}
                            className="inline-flex items-center gap-1.5 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 whitespace-nowrap"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Acțiuni</span>
                            <ChevronDown className="w-3 h-3 opacity-70 flex-shrink-0" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4">
                  <div className="text-slate-400 text-sm">
                    Afișate {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, filteredTickets.length)} din {filteredTickets.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="border-slate-700 text-white hover:bg-slate-800/50 rounded-xl h-9"
                      disabled={currentPage === 1}
                      onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }}
                    >
                      Înapoi
                    </Button>
                    <div className="text-slate-300 text-sm">
                      Pagina {currentPage} / {totalPages}
                    </div>
                    <Button
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl h-9"
                      disabled={currentPage === totalPages}
                      onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                    >
                      Înainte
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ServiceDashboard;

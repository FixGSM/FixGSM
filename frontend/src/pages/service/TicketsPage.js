import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Smartphone, User, Phone, Cpu, Shield, AlertTriangle, Wrench, Eye, Palette, Zap, FileText, DollarSign, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TicketsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
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

  const token = localStorage.getItem('fixgsm_token');
  const userType = localStorage.getItem('fixgsm_user_type');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchData();
  }, [selectedLocation]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showClientDropdown && !event.target.closest('.client-search-container')) {
        setShowClientDropdown(false);
        setClientSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClientDropdown]);

  const fetchData = async () => {
    try {
      const locationParam = selectedLocation !== 'all' ? `?location_id=${selectedLocation}` : '';
      const [ticketsRes, locationsRes, statusesRes] = await Promise.all([
        axios.get(`${API}/tickets${locationParam}`, config),
        axios.get(`${API}/tenant/locations`, config),
        axios.get(`${API}/tenant/custom-statuses`, config)
      ]);
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
    if (statusObj) return statusObj.color;
    
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('receptionat') || lowerStatus.includes('garantie')) {
      return '#3b82f6';
    } else if (lowerStatus.includes('reparatie') || lowerStatus.includes('verificare')) {
      return '#06b6d4';
    } else if (lowerStatus.includes('asteptare') || lowerStatus.includes('piesa')) {
      return '#f59e0b';
    } else if (lowerStatus.includes('gata') || lowerStatus.includes('finalizat')) {
      return '#22c55e';
    }
    return '#64748b';
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.location_id === locationId);
    return location?.location_name || 'N/A';
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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white" data-testid="tickets-title">{t('tickets.title')}</h1>
            <p className="text-slate-400">{t('tickets.manageAll')}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                data-testid="new-ticket-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('tickets.new')}
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
                      <Label className="text-slate-300 font-medium">{t('tickets.searchOrAddClient')}</Label>
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
                        {/* Debug info */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-red-900 border border-red-700 rounded-xl shadow-lg p-2 text-xs text-white">
                            <div>showClientDropdown: {showClientDropdown.toString()}</div>
                            <div>clientSearchResults.length: {clientSearchResults.length}</div>
                            <div>client_name.length: {formData.client_name.length}</div>
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
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        {loading ? (
          <div className="text-white text-center py-12">Se încarcă...</div>
        ) : filteredTickets.length === 0 ? (
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
                      <th className="text-left p-6 text-slate-400 font-semibold">#</th>
                      <th className="text-left p-6 text-slate-400 font-semibold">Dispozitiv</th>
                      <th className="text-left p-6 text-slate-400 font-semibold">Defecte reclamate</th>
                      <th className="text-left p-6 text-slate-400 font-semibold">Operațiuni service</th>
                      <th className="text-left p-6 text-slate-400 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.ticket_id}
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all duration-300"
                        onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                        data-testid={`ticket-row-${ticket.ticket_id}`}
                      >
                        <td className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                              <Smartphone className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="text-white font-semibold text-lg">{ticket.ticket_id}</div>
                              <div className="text-slate-400 text-sm">{new Date(ticket.created_at).toLocaleDateString('ro-RO')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="text-white font-medium text-lg">{ticket.device_model}</div>
                          <div className="text-slate-400 text-sm">{ticket.client_name}</div>
                        </td>
                        <td className="p-6">
                          <div className="text-slate-300 truncate max-w-xs">{ticket.reported_issue}</div>
                        </td>
                        <td className="p-6">
                          <div className="text-slate-300 truncate max-w-xs">{ticket.service_operations || '-'}</div>
                        </td>
                        <td className="p-6">
                          <Badge
                            className="text-white px-4 py-2 rounded-xl font-medium"
                            style={{ backgroundColor: getStatusColor(ticket.status) }}
                          >
                            {ticket.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TicketsPage;

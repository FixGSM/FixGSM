import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Smartphone, User, Phone, Calendar, DollarSign, Shield, Eye, Palette, AlertTriangle, Wrench, FileText, Clock, CheckCircle, Camera, MessageSquare, PhoneCall, Mail, Package, Zap, Settings, Bell, Search, ChevronDown, Plus, ArrowUp, Trash2, SquarePen } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TicketDetailPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusOpen, setStatusOpen] = useState(false);

  const token = localStorage.getItem('fixgsm_token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchData();
  }, [ticketId]);

  const fetchData = async () => {
    try {
      const [ticketRes, statusesRes] = await Promise.all([
        axios.get(`${API}/tickets/${ticketId}`, config),
        axios.get(`${API}/tenant/custom-statuses`, config)
      ]);
      setTicket(ticketRes.data);
      setStatuses(statusesRes.data.statuses || []);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Eroare la încărcarea fișei');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`${API}/tickets/${ticketId}`, { status: newStatus }, config);
      toast.success('Status actualizat!');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Eroare la actualizarea statusului');
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm('Sigur ștergi această fișă?');
    if (!ok) return;
    try {
      await axios.delete(`${API}/tickets/${ticketId}`, config);
      toast.success('Fișa a fost ștearsă');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Eroare la ștergere');
    }
  };

  const telHref = `tel:${ticket?.client_phone || ''}`;
  const smsHref = `sms:${ticket?.client_phone || ''}`;

  const getStatusColor = (status) => {
    const statusObj = statuses.find(s => s.label === status);
    return statusObj?.color || '#64748b';
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

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi
          </Button>
          <div className="text-center py-12 text-slate-400">Fișa nu a fost găsită</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Hero Header - similar cu pagina Client */}
        <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 shadow-2xl shadow-black/20 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 text-white text-2xl font-semibold">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white">Fișă {ticket.ticket_id}</div>
              <div className="text-slate-400 flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(ticket.created_at).toLocaleDateString('ro-RO')}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {ticket.urgent && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 px-4 py-2 rounded-xl">URGENT</Badge>
            )}
            <div className="relative">
              <button
                className="text-white px-4 py-2 rounded-xl font-medium border border-white/10 hover:bg-white/10"
                style={{ backgroundColor: getStatusColor(ticket.status) }}
                onClick={() => setStatusOpen(v => !v)}
                title="Schimbă status"
              >
                {ticket.status}
              </button>
              {statusOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-xl z-50">
                  <div className="max-h-64 overflow-y-auto py-2">
                    {statuses.map((s) => (
                      <button
                        key={s.label}
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-800 flex items-center gap-2"
                        onClick={() => { setStatusOpen(false); handleStatusChange(s.label); }}
                      >
                        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Înapoi
            </Button>
          </div>
        </div>

        {/* Content Grid - master card cu coloană stânga (2 carduri mici) + dreapta conținut */}
        <Card className="glass-effect rounded-3xl border border-white/10 shadow-2xl shadow-black/20 w-full">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Col stânga: fișă service + client */}
              <div className="space-y-6 lg:col-span-1">
                {/* Card: Fișă service (info + acțiuni icon) */}
                <div className="rounded-2xl p-5 bg-slate-900/60 border border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-slate-400 text-xs">Fișă service</div>
                      <div className="text-white font-semibold text-lg">#{ticket.ticket_id}</div>
                      <div className="text-slate-400 text-sm mt-1">{new Date(ticket.created_at).toLocaleString('ro-RO')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-300 hover:text-white hover:bg-white/10" onClick={() => toast.info('Editare fișă – în curând')} title="Editează fișa">
                        <SquarePen className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/10" onClick={handleDelete} title="Șterge fișa">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Card: Client (compact, cu butoane icon) */}
                <div className="rounded-2xl p-5 bg-slate-900/60 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-md">{ticket.client_name?.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold" data-testid="client-name">{ticket.client_name}</div>
                        <div className="text-slate-400 text-sm" data-testid="client-phone">{ticket.client_phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={telHref} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/25" title="Sună">
                        <PhoneCall className="w-4 h-4" />
                      </a>
                      <a href={smsHref} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25" title="Trimite SMS">
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Col dreapta: dispozitiv + cost + secțiuni */}
              <div className="lg:col-span-3 space-y-6">
                {/* Dispozitiv + Cost */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dispozitiv */}
                  <div className="rounded-2xl p-4 bg-slate-800/50 border border-white/10">
                    <div className="text-slate-400 text-xs mb-1">Model</div>
                    <div className="text-white font-semibold" data-testid="device-model">{ticket.device_model}</div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-slate-400 text-xs">IMEI / SN</div>
                        <div className="text-white text-sm">{ticket.imei || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs">Culoare</div>
                        <div className="text-white text-sm">{ticket.colors || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs">Cod Acces</div>
                        <div className="text-white text-sm">{ticket.access_code || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs">Aspect vizual</div>
                        <div className="text-white text-sm">{ticket.visual_aspect || 'N/A'}</div>
                  </div>
                    </div>
                  </div>
                  {/* Status - eliminat (mutat în header) */}
                  {/* Cost */}
                  <div className="rounded-2xl p-4 bg-emerald-500/5 border border-emerald-500/20 text-center">
                    <div className="text-emerald-400 text-xs mb-2 flex items-center justify-center gap-1"><DollarSign className="w-3 h-3" /> Cost</div>
                    <div className="text-2xl font-bold gradient-text font-['Space_Grotesk']" data-testid="estimated-cost">{ticket.estimated_cost} LEI</div>
                    <div className="text-slate-400 text-xs">Cost estimat</div>
                  </div>
                </div>

                {/* Defecte / Operațiuni / Observații */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="rounded-2xl p-4 bg-red-500/5 border border-red-500/20">
                    <div className="text-red-400 text-xs mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Defecte</div>
                    <div className="text-white text-sm leading-relaxed" data-testid="reported-issue">{ticket.reported_issue}</div>
                  </div>
                  {ticket.service_operations && (
                    <div className="rounded-2xl p-4 bg-emerald-500/5 border border-emerald-500/20">
                      <div className="text-emerald-400 text-xs mb-2 flex items-center gap-1"><Wrench className="w-3 h-3" /> Operațiuni</div>
                      <div className="text-white text-sm leading-relaxed" data-testid="service-operations">{ticket.service_operations}</div>
                    </div>
                  )}
                  {ticket.observations && (
                    <div className="rounded-2xl p-4 bg-blue-500/5 border border-blue-500/20">
                      <div className="text-blue-400 text-xs mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Observații</div>
                      <div className="text-white text-sm leading-relaxed" data-testid="observations">{ticket.observations}</div>
                    </div>
                  )}
                </div>
                  </div>
                </div>
            {/* end outer grid */}
              </CardContent>
            </Card>
      </div>
    </DashboardLayout>
  );
};

export default TicketDetailPage;
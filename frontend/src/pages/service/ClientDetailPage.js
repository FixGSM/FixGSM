import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientDetailPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('fixgsm_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/tickets`, config);
        const all = Array.isArray(res.data) ? res.data : [];
        // clientId e compus ca name|phone când venim din ClientsPage
        const [idName, idPhone] = decodeURIComponent(clientId).split('|');
        const related = all.filter(t => (t.client_name || '-') === idName && (t.client_phone || '-') === idPhone);
        setTickets(related);
        setEdit({ name: idName || '', phone: idPhone || '', email: '' });
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  const createdAt = useMemo(() => {
    const dates = tickets.map(t => t.created_at).filter(Boolean).map(d => new Date(d));
    if (!dates.length) return '-';
    return new Date(Math.min(...dates)).toLocaleDateString('ro-RO');
  }, [tickets]);

  const onSave = async () => {
    setSaving(true);
    try {
      // Fără colecție separată de clienți, facem update în toate tichetele.
      const updates = tickets.map(t => axios.put(`${API}/tickets/${t.ticket_id}`, {
        service_operations: t.service_operations,
        defect_cause: t.defect_cause,
        observations: t.observations,
        estimated_cost: t.estimated_cost,
        status: t.status,
      }, config));
      await Promise.all(updates);
      navigate('/clients');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    // Fără colecție clienți, nu ștergem tichete; doar informăm utilizatorul
    navigate('/clients');
  };

  const onCreateTicket = () => {
    // deschidem dashboard și trigger pentru fișă nouă
    localStorage.setItem('prefill_client_name', edit.name);
    localStorage.setItem('prefill_client_phone', edit.phone);
    navigate('/dashboard');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('createTicket'));
    }, 0);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full text-white">Se încarcă...</div>
      </DashboardLayout>
    );
  }

  const statusColor = (s) => {
    const lower = (s || '').toLowerCase();
    if (lower.includes('garantie')) return '#3b82f6';
    if (lower.includes('repar') || lower.includes('verific')) return '#06b6d4';
    if (lower.includes('astept')) return '#f59e0b';
    if (lower.includes('gata') || lower.includes('final')) return '#22c55e';
    return '#64748b';
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 shadow-2xl shadow-black/20 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 text-white text-2xl font-semibold">
              {(edit.name || '-').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white">{edit.name || 'Client'}</div>
              <div className="text-slate-400">Creat la {createdAt}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-xl" onClick={onCreateTicket}>Fișă Nouă</Button>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl" onClick={onSave} disabled={saving}>Salvează</Button>
            <Button variant="outline" className="border-red-500/40 text-red-300 hover:bg-red-500/10" onClick={onDelete}>Șterge</Button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info Card */}
          <Card className="glass-effect rounded-3xl border border-white/10 shadow-2xl shadow-black/20 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Informații Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="block text-slate-300 text-sm mb-1">Nume</label>
                <Input className="bg-slate-800/50 border-slate-700 text-white" value={edit.name} onChange={e=>setEdit(v=>({...v,name:e.target.value}))} />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Telefon</label>
                <Input className="bg-slate-800/50 border-slate-700 text-white" value={edit.phone} onChange={e=>setEdit(v=>({...v,phone:e.target.value}))} />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Email</label>
                <Input className="bg-slate-800/50 border-slate-700 text-white" value={edit.email} onChange={e=>setEdit(v=>({...v,email:e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl p-4 bg-slate-800/50 border border-white/10">
                  <div className="text-slate-400 text-xs">Total fișe</div>
                  <div className="text-white text-xl font-semibold">{tickets.length}</div>
                </div>
                <div className="rounded-2xl p-4 bg-slate-800/50 border border-white/10">
                  <div className="text-slate-400 text-xs">Ultima activitate</div>
                  <div className="text-white text-xl font-semibold">{tickets.length ? new Date(Math.max(...tickets.map(t=>new Date(t.updated_at||t.created_at)))).toLocaleDateString('ro-RO') : '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Card */}
          <Card className="glass-effect rounded-3xl border border-white/10 shadow-2xl shadow-black/20 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Istoric Fișe</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-6 text-slate-400 font-semibold">#</th>
                      <th className="text-left p-6 text-slate-400 font-semibold">Dispozitiv</th>
                      <th className="text-left p-6 text-slate-400 font-semibold">Defecte</th>
                      <th className="text-left p-6 text-slate-400 font-semibold">Status</th>
                      <th className="text-left p-6 text-slate-400 font-semibold">Creat la</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(t => (
                      <tr key={t.ticket_id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer" onClick={()=>navigate(`/tickets/${t.ticket_id}`)}>
                        <td className="p-6 text-white font-medium">{t.ticket_id}</td>
                        <td className="p-6 text-slate-300">{t.device_model}</td>
                        <td className="p-6 text-slate-300 truncate max-w-xs">{t.reported_issue}</td>
                        <td className="p-6">
                          <Badge className="text-white px-4 py-2 rounded-xl font-medium" style={{ backgroundColor: statusColor(t.status) }}>{t.status}</Badge>
                        </td>
                        <td className="p-6 text-slate-300">{new Date(t.created_at).toLocaleDateString('ro-RO')}</td>
                      </tr>
                    ))}
                    {tickets.length === 0 && (
                      <tr><td className="p-8 text-center text-slate-400" colSpan={5}>Nu există fișe</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDetailPage;



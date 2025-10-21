import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const token = localStorage.getItem('fixgsm_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    (async () => {
      try {
        // încercăm endpoint-ul /tenant/clients
        const res = await axios.get(`${API}/tenant/clients`, config);
        setClients(Array.isArray(res.data) ? res.data : (res.data?.clients || []));
      } catch (e) {
        // Fallback: derivăm clienți din tichete dacă endpoint-ul nu există (404)
        try {
          const ticketsRes = await axios.get(`${API}/tickets`, config);
          const tickets = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];
          const map = {};
          tickets.forEach(t => {
            const name = t.client_name || '-';
            const phone = t.client_phone || '-';
            const key = `${name}|${phone}`;
            if (!map[key]) {
              map[key] = {
                client_id: key,
                name,
                phone,
                email: null,
                created_at: t.created_at,
              };
            } else {
              const existing = map[key];
              if (t.created_at && existing.created_at) {
                existing.created_at = new Date(t.created_at) < new Date(existing.created_at) ? t.created_at : existing.created_at;
              } else if (t.created_at && !existing.created_at) {
                existing.created_at = t.created_at;
              }
            }
          });
          setClients(Object.values(map));
        } catch (_ignored) {
          setClients([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const filtered = clients.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      (c.first_name || '').toLowerCase().includes(q) ||
      (c.last_name || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const getName = (c) => c.name || [c.first_name, c.last_name].filter(Boolean).join(' ') || '-';
  const getCreatedAt = (c) => c.created_at ? new Date(c.created_at).toLocaleDateString('ro-RO') : '-';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full text-white">Se încarcă...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="glass-effect rounded-3xl border border-white/10 shadow-2xl shadow-black/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div className="text-2xl font-bold text-white">Clienți</div>
              <input
                className="bg-slate-800/50 border border-slate-700 text-white rounded-xl h-11 px-4 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-300 w-full md:w-80"
                placeholder="Caută după nume, telefon, email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect rounded-3xl border border-white/10 shadow-2xl shadow-black/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-6 text-slate-400 font-semibold">Nume</th>
                    <th className="text-left p-6 text-slate-400 font-semibold">Telefon</th>
                    <th className="text-left p-6 text-slate-400 font-semibold">Email</th>
                    <th className="text-left p-6 text-slate-400 font-semibold">Creat la</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => (
                    <tr key={c.client_id || c.id || getName(c)} className="border-b border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => navigate(`/clients/${encodeURIComponent(c.client_id || getName(c))}`)}>
                      <td className="p-6 text-white font-medium">{getName(c)}</td>
                      <td className="p-6 text-slate-300">{c.phone || '-'}</td>
                      <td className="p-6 text-slate-300">{c.email || '-'}</td>
                      <td className="p-6 text-slate-300">{getCreatedAt(c)}</td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr><td className="p-8 text-center text-slate-400" colSpan={4}>Nu s-au găsit clienți</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4">
                <div className="text-slate-400 text-sm">Afișate {start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)} din {filtered.length}</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800/50 rounded-xl h-9" disabled={currentPage===1} onClick={() => setCurrentPage(p=>Math.max(1,p-1))}>Înapoi</Button>
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const buttons = [];
                      const addBtn = (n, label) => buttons.push(
                        <button
                          key={`p-${label}`}
                          onClick={() => typeof n === 'number' && setCurrentPage(n)}
                          disabled={typeof n !== 'number'}
                          className={`min-w-9 h-9 px-3 rounded-lg text-sm ${currentPage===n ? 'bg-cyan-600 text-white' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'} ${typeof n !== 'number' ? 'cursor-default opacity-60' : ''}`}
                        >
                          {label}
                        </button>
                      );
                      const window = 1;
                      if (totalPages <= 7) {
                        for (let i=1;i<=totalPages;i++) addBtn(i, i);
                      } else {
                        addBtn(1, 1);
                        if (currentPage > 3) addBtn(null, '…');
                        const startP = Math.max(2, currentPage - window);
                        const endP = Math.min(totalPages - 1, currentPage + window);
                        for (let i=startP;i<=endP;i++) addBtn(i, i);
                        if (currentPage < totalPages - 2) addBtn(null, '…');
                        addBtn(totalPages, totalPages);
                      }
                      return buttons;
                    })()}
                  </div>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl h-9" disabled={currentPage===totalPages} onClick={() => setCurrentPage(p=>Math.min(totalPages,p+1))}>Înainte</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientsPage;



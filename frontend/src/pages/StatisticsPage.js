import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  FileText, 
  Clock, 
  Smartphone, 
  Download, 
  Sparkles, 
  MessageSquare,
  Calendar,
  Target,
  PieChart,
  Activity,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import StatisticsAnalyzer from '@/components/StatisticsAnalyzer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StatisticsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('all');

  const token = localStorage.getItem('fixgsm_token');
  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/statistics`, authHeaders);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Eroare la încărcarea statisticilor');
    } finally {
      setLoading(false);
    }
  };

  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return;

    try {
      setAiLoading(true);
      const response = await axios.post(`${API}/ai/analyze-statistics`, {
        query: aiQuery,
        tenant_id: localStorage.getItem('fixgsm_tenant_id')
      }, authHeaders);

      setAiResponse(response.data.analysis);
    } catch (error) {
      console.error('Error analyzing statistics:', error);
      toast.error('Eroare la analiza statisticilor');
    } finally {
      setAiLoading(false);
    }
  };

  const exportToPDF = () => {
    toast.success('Export PDF în dezvoltare...');
  };

  const exportToExcel = () => {
    toast.success('Export Excel în dezvoltare...');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-4" />
            <p className="text-slate-400">Se încarcă statisticile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-400" />
              Analiză Statistici AI
            </h1>
            <p className="text-slate-400 mt-2">
              Analizează performanța business-ului cu AI și statistici detaliate
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Ultimele 7 zile</SelectItem>
                <SelectItem value="30d">Ultimele 30 zile</SelectItem>
                <SelectItem value="90d">Ultimele 90 zile</SelectItem>
                <SelectItem value="1y">Ultimul an</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchStatistics}
              variant="outline"
              className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizează
            </Button>
          </div>
        </div>

        {/* AI Chat Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Statistics */}
          <div className="lg:col-span-3 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-effect border border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Venituri Totale</p>
                      <p className="text-2xl font-bold text-white">
                        {stats?.total_revenue || '0'} RON}
                      </p>
                      <div className="flex items-center mt-1">
                        <ArrowUp className="w-4 h-4 text-green-400 mr-1" />
                        <span className="text-green-400 text-sm">+12.5%</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Fișe Finalizate</p>
                      <p className="text-2xl font-bold text-white">
                        {stats?.completed_tickets || 0}
                      </p>
                      <div className="flex items-center mt-1">
                        <ArrowUp className="w-4 h-4 text-green-400 mr-1" />
                        <span className="text-green-400 text-sm">+8.2%</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Clienți Activi</p>
                      <p className="text-2xl font-bold text-white">
                        {stats?.active_clients || 0}
                      </p>
                      <div className="flex items-center mt-1">
                        <ArrowUp className="w-4 h-4 text-green-400 mr-1" />
                        <span className="text-green-400 text-sm">+15.3%</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Timp Mediu Reparație</p>
                      <p className="text-2xl font-bold text-white">
                        {stats?.avg_repair_time || '0'}h
                      </p>
                      <div className="flex items-center mt-1">
                        <ArrowDown className="w-4 h-4 text-red-400 mr-1" />
                        <span className="text-red-400 text-sm">-5.2%</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="glass-effect border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Evoluția Veniturilor
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Venituri pe ultimele 30 de zile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-slate-800/50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-400">Grafic în dezvoltare</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tickets Status Distribution */}
              <Card className="glass-effect border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-400" />
                    Distribuția Fișelor
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Statusuri curente ale fișelor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-slate-800/50 rounded-lg">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-400">Grafic în dezvoltare</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Device Statistics */}
            <Card className="glass-effect border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-purple-400" />
                  Statistici Dispozitive
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Cele mai frecvente probleme și dispozitive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-semibold mb-3">Top Dispozitive</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-white">iPhone 12 Pro Max</span>
                        <Badge className="bg-blue-500/20 text-blue-300">23</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-white">Samsung Galaxy S21</span>
                        <Badge className="bg-green-500/20 text-green-300">18</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-white">iPhone 13</span>
                        <Badge className="bg-purple-500/20 text-purple-300">15</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-3">Top Probleme</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-white">Ecran spart</span>
                        <Badge className="bg-red-500/20 text-red-300">45%</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-white">Probleme baterie</span>
                        <Badge className="bg-orange-500/20 text-orange-300">28%</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-white">Probleme software</span>
                        <Badge className="bg-yellow-500/20 text-yellow-300">27%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Chat Sidebar */}
          <div className="lg:col-span-1">
            <Card className="glass-effect border border-indigo-500/30 bg-indigo-500/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  AI Assistant
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Întreabă despre statistici în română
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-slate-300">Întrebare AI</Label>
                  <Textarea
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Ex: Care sunt cele mai frecvente probleme luna asta?"
                    className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                  />
                  <Button
                    onClick={handleAIQuery}
                    disabled={!aiQuery.trim() || aiLoading}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                  >
                    {aiLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Analizează cu AI
                  </Button>
                </div>

                {aiResponse && (
                  <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h4 className="text-white font-semibold mb-2">Analiza AI:</h4>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-slate-300">Întrebări rapide:</Label>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start border-slate-700 text-slate-300 hover:bg-slate-700"
                      onClick={() => setAiQuery("Care sunt cele mai frecvente probleme luna asta?")}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Probleme frecvente
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start border-slate-700 text-slate-300 hover:bg-slate-700"
                      onClick={() => setAiQuery("Cum evoluează profitul pe ultimele 3 luni?")}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Evoluție profit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start border-slate-700 text-slate-300 hover:bg-slate-700"
                      onClick={() => setAiQuery("Care sunt cele mai profitabile tipuri de reparații?")}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Profitabilitate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card className="glass-effect border border-white/10 mt-4">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-green-400" />
                  Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={exportToPDF}
                  variant="outline"
                  className="w-full border-red-500/30 text-red-300 hover:bg-red-500/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  className="w-full border-green-500/30 text-green-300 hover:bg-green-500/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StatisticsPage;

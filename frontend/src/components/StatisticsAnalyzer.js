import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, DollarSign, Clock, Smartphone, MessageSquare, X, Sparkles, Copy, Check, Lightbulb, Target } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StatisticsAnalyzer = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem('fixgsm_token');
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const exampleQueries = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      text: "Câte fișe am avut săptămâna trecută?",
      category: "Timp"
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      text: "Care este venitul mediu per fișă?",
      category: "Financiar"
    },
    {
      icon: <Smartphone className="w-4 h-4" />,
      text: "Care sunt cele mai comune probleme iPhone?",
      category: "Dispozitive"
    },
    {
      icon: <Users className="w-4 h-4" />,
      text: "Câți clienți noi am avut luna aceasta?",
      category: "Clienți"
    },
    {
      icon: <Clock className="w-4 h-4" />,
      text: "Cât timp durează în medie o reparație?",
      category: "Performanță"
    },
    {
      icon: <MessageSquare className="w-4 h-4" />,
      text: "Cât costă AI-ul pe lună?",
      category: "AI"
    }
  ];

  const handleAnalyze = async () => {
    if (!query.trim()) {
      toast.error('Introduceți o întrebare');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const response = await axios.post(`${API}/ai/analyze-statistics`, {
        query: query.trim()
      }, { headers: authHeaders });

      const data = response.data;
      setAnalysis(data.analysis);
      toast.success('Analiza completată cu succes!');

    } catch (error) {
      console.error('Error analyzing statistics:', error);
      toast.error(error.response?.data?.detail || 'Eroare la analiza statisticilor');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExampleQuery = (exampleQuery) => {
    setQuery(exampleQuery);
  };

  const handleCopyAnalysis = async () => {
    if (!analysis) return;
    
    try {
      await navigator.clipboard.writeText(analysis.response);
      setCopied(true);
      toast.success('Analiza copiată în clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Eroare la copierea analizei');
    }
  };

  const resetForm = () => {
    setQuery('');
    setAnalysis(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatAnalysis = (text) => {
    if (!text) return '';
    
    // Simple formatting for better readability
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-effect border border-white/10 text-white max-w-6xl h-[90vh] flex flex-col rounded-3xl p-0">
        <DialogHeader className="p-6 pb-4 border-b border-slate-700 flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold gradient-text font-['Space_Grotesk'] flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-purple-400" />
            Analiză Statistici AI
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={handleClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Query Input */}
          <div className="space-y-4">
            <Label className="text-slate-300 text-lg">Întrebarea ta</Label>
            <div className="flex space-x-3">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Câte fișe am avut săptămâna trecută?"
                className="flex-1 bg-slate-800/50 border-slate-700 text-white rounded-xl h-12 focus:border-purple-500 focus:ring-purple-500/20"
                onKeyPress={(e) => { if (e.key === 'Enter') handleAnalyze(); }}
              />
              <Button
                onClick={handleAnalyze}
                disabled={!query.trim() || isAnalyzing}
                className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Example Queries */}
          {!analysis && (
            <div className="space-y-4">
              <Label className="text-slate-300 text-lg">Întrebări de exemplu</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exampleQueries.map((example, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:border-slate-600 cursor-pointer transition-all duration-200 hover:bg-slate-800/70"
                    onClick={() => handleExampleQuery(example.text)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-purple-400">{example.icon}</div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{example.text}</p>
                        <Badge variant="outline" className="text-xs bg-slate-700/50 text-slate-300 border-slate-600 mt-1">
                          {example.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-lg">Rezultatul analizei</Label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAnalysis}
                    className="bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white"
                  >
                    {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? 'Copiat!' : 'Copiază'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAnalysis(null)}
                    className="bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white"
                  >
                    Analiză nouă
                  </Button>
                </div>
              </div>

              {/* Main Analysis */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                    Analiză detaliată
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="text-slate-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis.response) }}
                  />
                </CardContent>
              </Card>

              {/* Insights */}
              {analysis.insights && analysis.insights.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                      Insights cheie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.insights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-slate-200 text-sm">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Statistics */}
              {analysis.statistics && analysis.statistics.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                      Statistici relevante
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.statistics.map((stat, index) => (
                        <Badge key={index} variant="outline" className="bg-green-500/20 text-green-300 border-green-500/50">
                          {stat}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white flex items-center">
                      <Target className="w-5 h-5 mr-2 text-blue-400" />
                      Recomandări
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-slate-200 text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose} className="bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white">
            Închide
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatisticsAnalyzer;

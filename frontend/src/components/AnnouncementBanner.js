import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Bell, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  const token = localStorage.getItem('fixgsm_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchAnnouncements();
    // Poll for new announcements every 5 minutes
    const interval = setInterval(fetchAnnouncements, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API}/tenant/announcements`, config);
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleDismiss = async (announcementId) => {
    try {
      await axios.post(`${API}/tenant/announcements/${announcementId}/dismiss`, {}, config);
      setAnnouncements(announcements.filter(a => a.announcement_id !== announcementId));
      toast.success('Anunț ascuns');
    } catch (error) {
      console.error('Error dismissing announcement:', error);
      toast.error('Eroare la ascunderea anunțului');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'info':
        return <Info className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case 'info':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (announcements.length === 0) {
    return null;
  }

  if (collapsed) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setCollapsed(false)}
          className="relative bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg"
        >
          <Bell className="w-4 h-4 mr-2" />
          Anunțuri
          <Badge className="ml-2 bg-red-500 text-white border-red-600">
            {announcements.length}
          </Badge>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      {announcements.map((announcement) => (
        <Card 
          key={announcement.announcement_id} 
          className={`glass-effect border ${getTypeClass(announcement.type)}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className={`${getTypeClass(announcement.type)} p-2 rounded-lg`}>
                {getIcon(announcement.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-white font-semibold">{announcement.title}</h4>
                  <Badge className={getTypeClass(announcement.type)}>
                    {announcement.type}
                  </Badge>
                </div>
                <p className="text-slate-300 text-sm">{announcement.message}</p>
                {announcement.expires_at && (
                  <p className="text-slate-500 text-xs mt-2">
                    Expiră: {new Date(announcement.expires_at).toLocaleDateString('ro-RO')}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDismiss(announcement.announcement_id)}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(true)}
          className="text-slate-400 hover:text-white"
        >
          Minimizează anunțurile
        </Button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;


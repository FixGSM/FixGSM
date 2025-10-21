import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    location_name: '',
    address: ''
  });

  const token = localStorage.getItem('fixgsm_token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API}/tenant/locations`, config);
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Eroare la încărcarea locațiilor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tenant/locations`, formData, config);
      toast.success('Locație adăugată cu succes!');
      setDialogOpen(false);
      setFormData({ location_name: '', address: '' });
      fetchLocations();
    } catch (error) {
      console.error('Error creating location:', error);
      toast.error('Eroare la adăugarea locației');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white" data-testid="locations-title">Locații</h1>
            <p className="text-slate-400">Gestionează punctele de lucru ale service-ului tău</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                data-testid="add-location-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Locație Nouă
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Adăugă Locație Nouă</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Completează detaliile pentru noul punct de lucru
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="location_name" className="text-slate-300">Nume Locație</Label>
                  <Input
                    id="location_name"
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="ex: Service Pipera"
                    data-testid="location-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="text-slate-300">Adresă</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Strada, Nr, Sector, Oraș"
                    data-testid="address-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  data-testid="submit-location-btn"
                >
                  Adăugă Locație
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Locations Grid */}
        {loading ? (
          <div className="text-white text-center py-12">Se încarcă...</div>
        ) : locations.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-12 text-center text-slate-400" data-testid="no-locations">
              Nu există locații adăugate. Adăugă prima locație!
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <Card
                key={location.location_id}
                className="bg-slate-900 border-slate-800 card-hover"
                data-testid={`location-${location.location_id}`}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{location.location_name}</CardTitle>
                      <CardDescription className="text-slate-400 text-sm">
                        {new Date(location.created_at).toLocaleDateString('ro-RO')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">{location.address}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LocationsPage;

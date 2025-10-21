import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Receptie',
    location_id: ''
  });

  const token = localStorage.getItem('fixgsm_token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, locationsRes] = await Promise.all([
        axios.get(`${API}/tenant/employees`, config),
        axios.get(`${API}/tenant/locations`, config)
      ]);
      setEmployees(employeesRes.data);
      setLocations(locationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tenant/employees`, formData, config);
      toast.success('Angajat adăugat cu succes!');
      setDialogOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'Receptie', location_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error(error.response?.data?.detail || 'Eroare la adăugarea angajatului');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Manager':
        return 'bg-purple-500';
      case 'Technician':
        return 'bg-cyan-500';
      case 'Receptie':
        return 'bg-blue-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.location_id === locationId);
    return location?.location_name || 'N/A';
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white" data-testid="employees-title">Angajați</h1>
            <p className="text-slate-400">Gestionează echipa ta de lucru</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                data-testid="add-employee-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Angajat Nou
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Adăugă Angajat Nou</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Completează detaliile pentru noul angajat
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-300">Nume Complet</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="email-input"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-slate-300">Parolă</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="password-input"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="text-slate-300">Rol</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Receptie" className="text-white">Recepție</SelectItem>
                      <SelectItem value="Technician" className="text-white">Technician</SelectItem>
                      <SelectItem value="Manager" className="text-white">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location" className="text-slate-300">Locație</Label>
                  <Select value={formData.location_id} onValueChange={(value) => setFormData({ ...formData, location_id: value })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="location-select">
                      <SelectValue placeholder="Selectează locația" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {locations.map((location) => (
                        <SelectItem key={location.location_id} value={location.location_id} className="text-white">
                          {location.location_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  disabled={!formData.location_id}
                  data-testid="submit-employee-btn"
                >
                  Adăugă Angajat
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Employees Grid */}
        {loading ? (
          <div className="text-white text-center py-12">Se încarcă...</div>
        ) : employees.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-12 text-center text-slate-400" data-testid="no-employees">
              Nu există angajați adăugați. Adăugă primul angajat!
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <Card
                key={employee.user_id}
                className="bg-slate-900 border-slate-800 card-hover"
                data-testid={`employee-${employee.user_id}`}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white">{employee.name}</CardTitle>
                      <CardDescription className="text-slate-400 text-sm">
                        {employee.email}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Rol:</span>
                    <Badge className={`${getRoleBadgeColor(employee.role)} text-white`}>
                      {employee.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Locație:</span>
                    <div className="flex items-center text-white text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      {getLocationName(employee.location_id)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployeesPage;

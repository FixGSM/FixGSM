import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { 
  Settings, 
  MapPin, 
  Users, 
  CreditCard, 
  Palette, 
  Plus, 
  Trash2, 
  Building2,
  UserCircle,
  ShieldCheck,
  DollarSign,
  Wrench,
  Package,
  FileText,
  Zap,
  Bell,
  Lock,
  Star,
  Sparkles,
  MessageSquare,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Payment History Component
const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('fixgsm_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await axios.get(`${API}/tenant/payment-history`, config);
      setPayments(response.data.payments || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (paymentId, invoiceNumber) => {
    try {
      const response = await axios.get(`${API}/tenant/invoice/${paymentId}`, {
        ...config,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura_${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Factură descărcată cu succes!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Eroare la descărcarea facturii');
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('ro-RO', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-slate-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Istoric Plăți</h3>
        <p className="text-slate-400 text-center py-8">Nu există plăți înregistrate încă.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Istoric Plăți</h3>
      
      <div className="space-y-3">
        {payments.map((payment) => (
          <div 
            key={payment.payment_id} 
            className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between hover:border-cyan-500/30 transition-all"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                  {payment.plan}
                </Badge>
                <span className="text-slate-400 text-sm">
                  {payment.invoice_number || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-300">
                <span>📅 {formatDate(payment.created_at)}</span>
                <span>⏱️ {payment.months} {payment.months === 1 ? 'lună' : 'luni'}</span>
                <span className="text-cyan-400 font-semibold">{payment.amount} RON</span>
              </div>
            </div>
            
            <Button
              size="sm"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              onClick={() => handleDownloadInvoice(payment.payment_id, payment.invoice_number)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descarcă Factură
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Plan Cards Component
const PlanCards = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('fixgsm_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchSubscriptionStatus();
    fetchAvailablePlans();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API}/tenant/subscription-status`, config);
      setSubscriptionData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const response = await axios.get(`${API}/tenant/subscription-plans`, config);
      setAvailablePlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const currentPlan = subscriptionData?.subscription_plan || 'Trial';

  if (loading || availablePlans.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Planuri Disponibile</h3>
        <div className="text-center py-8">
          <div className="text-slate-400">Se încarcă planurile...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Planuri Disponibile</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {availablePlans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.name;
          const isRecommended = plan.plan_id === 'pro';
          const isTrial = plan.plan_id === 'trial';
          
          return (
            <Card 
              key={plan.plan_id} 
              className={`glass-effect ${
                isCurrentPlan 
                  ? isTrial 
                    ? 'border-2 border-amber-500' 
                    : 'border-2 border-green-500'
                  : isRecommended 
                    ? 'border-2 border-cyan-500' 
                    : 'border border-white/10'
              } relative`}
            >
              {isRecommended && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500">Recomandat</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <CardDescription>
                  {isTrial ? 'Perioadă de testare 14 zile' : 
                   plan.plan_id === 'pro' ? 'Pentru servicii în creștere' : 
                   'Pentru rețele mari'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white mb-4">
                  {plan.price === 0 ? (
                    <>
                      GRATUIT
                      <span className="text-sm font-normal text-slate-400 block">14 zile</span>
                    </>
                  ) : (
                    <>
                      {plan.price} RON
                      <span className="text-sm font-normal text-slate-400">/lună</span>
                    </>
                  )}
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  {plan.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <Button 
                    className={`w-full mt-4 ${isTrial ? 'bg-amber-600' : 'bg-green-600'}`} 
                    disabled
                  >
                    {isTrial ? 'Plan Curent (Trial)' : 'Plan Curent'}
                  </Button>
                ) : isTrial ? (
                  <Button className="w-full mt-4 bg-slate-700" disabled>
                    Disponibil la înregistrare
                  </Button>
                ) : (
                  <PaymentButton 
                    plan={plan.name} 
                    price={plan.price} 
                    onSuccess={() => {
                      fetchSubscriptionStatus();
                      fetchAvailablePlans();
                    }} 
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Payment Button Component
const PaymentButton = ({ plan, price, onSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [months, setMonths] = useState(1);

  const token = localStorage.getItem('fixgsm_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const totalAmount = price * months;

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const response = await axios.post(`${API}/tenant/process-payment`, {
        plan: plan,
        months: months
      }, config);

      toast.success('Plată procesată cu succes!', {
        description: `Abonament ${plan} activ pentru ${months} ${months === 1 ? 'lună' : 'luni'}. Total: ${totalAmount} RON`,
        duration: 6000
      });

      setShowDialog(false);
      
      // Call onSuccess callback to refresh data
      if (onSuccess) {
        onSuccess();
      }
      
      // Refresh page after 2 seconds to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Eroare la procesarea plății', {
        description: error.response?.data?.detail || 'Te rugăm să încerci din nou.',
        duration: 6000
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Button 
        className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        onClick={() => setShowDialog(true)}
      >
        {plan === 'Pro' ? 'Upgrade la Pro' : 'Upgrade la Enterprise'}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="glass-effect border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Plată Abonament {plan}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Selectează perioada de plată și confirmă comanda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Plan Details */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300">Plan selectat:</span>
                <span className="text-white font-semibold">{plan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Preț lunar:</span>
                <span className="text-white font-semibold">{price} RON</span>
              </div>
            </div>

            {/* Months Selection */}
            <div>
              <Label className="text-slate-300 mb-2 block">Perioadă de plată</Label>
              <div className="grid grid-cols-3 gap-3">
                {[1, 3, 6, 12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMonths(m)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      months === m
                        ? 'border-cyan-500 bg-cyan-500/20 text-white'
                        : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-lg font-bold">{m}</div>
                    <div className="text-xs">{m === 1 ? 'lună' : 'luni'}</div>
                    {m > 1 && (
                      <div className="text-xs text-cyan-400 mt-1">
                        -{Math.round((1 - (price * m * 0.95) / (price * m)) * 100)}%
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex justify-between items-center text-lg">
                <span className="text-slate-300">Total de plată:</span>
                <span className="text-3xl font-bold text-cyan-400">{totalAmount} RON</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Plată simulată - în dezvoltare se va integra procesator de plăți real
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => setShowDialog(false)}
                disabled={processing}
              >
                Anulează
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? 'Se procesează...' : 'Confirmă Plata'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Subscription Status Card Component
const SubscriptionStatusCard = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('fixgsm_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchSubscriptionStatus();
    const interval = setInterval(fetchSubscriptionStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API}/tenant/subscription-status`, config);
      setSubscriptionData(response.data);
      setDaysRemaining(response.data.days_until_expiry);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (daysRemaining === null) return 'gray';
    if (daysRemaining <= 0) return 'red';
    if (daysRemaining <= 3) return 'red';
    if (daysRemaining <= 7) return 'amber';
    return 'green';
  };

  const getStatusBadge = () => {
    const status = subscriptionData?.subscription_status || 'pending';
    if (status === 'active' && daysRemaining > 0) {
      return <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">Activ</Badge>;
    } else if (status === 'active' && daysRemaining <= 0) {
      return <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white">Expirat</Badge>;
    } else if (status === 'suspended') {
      return <Badge className="bg-gradient-to-r from-gray-500 to-slate-500 text-white">Suspendat</Badge>;
    }
    return <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">În Așteptare</Badge>;
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return date.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const statusColor = getStatusColor();
  
  const getBgClasses = () => {
    if (statusColor === 'red') return 'bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20';
    if (statusColor === 'amber') return 'bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/20';
    if (statusColor === 'green') return 'bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20';
    return 'bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20';
  };
  
  const getDotClass = () => {
    if (statusColor === 'red') return 'bg-red-500';
    if (statusColor === 'amber') return 'bg-amber-500';
    if (statusColor === 'green') return 'bg-green-500';
    return 'bg-gray-500';
  };
  
  const getTextClass = () => {
    if (statusColor === 'red') return 'text-red-400';
    if (statusColor === 'amber') return 'text-amber-400';
    if (statusColor === 'green') return 'text-green-400';
    return 'text-gray-400';
  };

  return (
    <div className={`${getBgClasses()} rounded-xl p-6`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          Plan Curent: <span className="text-cyan-400">{subscriptionData?.subscription_plan || 'Basic'}</span>
        </h3>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Days Remaining - Countdown */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${getDotClass()} animate-pulse`}></div>
            <p className="text-sm text-slate-400">Zile Rămase</p>
          </div>
          <p className={`text-4xl font-bold ${getTextClass()}`}>
            {daysRemaining !== null ? (daysRemaining >= 0 ? daysRemaining : 0) : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {daysRemaining <= 0 ? 'Abonament expirat' : 'până la expirare'}
          </p>
        </div>

        {/* Price */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-2">Preț Lunar</p>
          <p className="text-3xl font-bold text-white">
            {subscriptionData?.subscription_price || 0}
            <span className="text-lg font-normal text-slate-400"> RON</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">/lună</p>
        </div>

        {/* Expiry Date */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-2">Data Expirării</p>
          <p className="text-lg font-semibold text-white">
            {formatDate(subscriptionData?.subscription_end_date)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {daysRemaining <= 3 && daysRemaining > 0 ? '⚠️ Expir ă în curând!' : 'Următoarea facturare'}
          </p>
        </div>
      </div>

      {/* Warning Message */}
      {daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && (
        <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p className="text-amber-400 text-sm">
            ⚠️ <strong>Atenție:</strong> Abonamentul tău va expira în {daysRemaining} {daysRemaining === 1 ? 'zi' : 'zile'}. 
            Te rugăm să reînnoiești abonamentul pentru a evita întreruperea serviciilor.
          </p>
        </div>
      )}

      {/* Expired Message */}
      {daysRemaining !== null && daysRemaining <= 0 && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">
            ❌ <strong>Abonament Expirat:</strong> Abonamentul tău a expirat. 
            Te rugăm să efectuezi plata pentru a reactiva serviciile.
          </p>
        </div>
      )}
    </div>
  );
};

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('brand');
  
  // Subscription data for limits
  const [subscriptionData, setSubscriptionData] = useState(null);
  
  // Status State
  const [statuses, setStatuses] = useState([]);
  const [statusFormData, setStatusFormData] = useState({
    category: 'NOU',
    label: '',
    color: '#3b82f6',
    icon: 'circle',
    description: '',
    order: 0,
    is_final: false,
    requires_note: false
  });
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);

  // Locations State
  const [locations, setLocations] = useState([]);
  const [locationFormData, setLocationFormData] = useState({
    location_name: '',
    address: '',
    phone: ''
  });
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  // Employees State
  const [employees, setEmployees] = useState([]);
  const [employeeFormData, setEmployeeFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Receptie',
    location_id: ''
  });
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);

  // Company/Brand State
  const [companyData, setCompanyData] = useState({
    company_name: '',
    service_name: '',
    cui: '',
    address: '',
    phone: '',
    email: '',
    logo: null
  });

  // Subscription State
  const [subscription, setSubscription] = useState(null);

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState({
    enabled: true,
    tone: 'professional', // professional, friendly, technical
    detail_level: 'detailed', // brief, balanced, detailed
    language: 'ro',
    custom_prompt: '',
    response_format: 'structured', // structured, conversational
    include_sources: true,
    auto_learn: true
  });

  // Integrations State
  const [integrations, setIntegrations] = useState({
    whatsapp: {
      enabled: false,
      phone_number_id: '',
      access_token: '',
      business_account_id: '',
      webhook_verified: false
    },
    smartbill: {
      enabled: false,
      api_key: '',
      company_id: ''
    },
    sms: {
      enabled: false,
      provider: '',
      api_key: ''
    },
    email: {
      enabled: false,
      smtp_server: '',
      smtp_port: 587,
      username: '',
      password: ''
    }
  });

  // Roles State
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [roleFormData, setRoleFormData] = useState({
    role_id: '',
    name: '',
    description: '',
    permissions: []
  });
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('fixgsm_token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const menuItems = [
    { id: 'brand', label: 'Brand Mobile', icon: Building2 },
    { id: 'account', label: 'Cont', icon: UserCircle },
    { id: 'subscription', label: 'Abonament', icon: CreditCard },
    { id: 'ai-config', label: 'Configurare AI', icon: Sparkles },
    { id: 'locations', label: 'Locații', icon: MapPin },
    { id: 'users', label: 'Utilizatori', icon: Users },
    { id: 'roles', label: 'Roluri', icon: ShieldCheck },
    { id: 'statuses', label: 'Statusuri', icon: Palette },
    { id: 'finances', label: 'Finanțe', icon: DollarSign },
    { id: 'services', label: 'Servicii', icon: Wrench },
    { id: 'parts', label: 'Piese', icon: Package },
    { id: 'documents', label: 'Documente', icon: FileText },
    { id: 'integrations', label: 'Integrări', icon: Zap },
    { id: 'notifications', label: 'Notificări', icon: Bell },
    { id: 'security', label: 'Securitate', icon: Lock },
    { id: 'reviews', label: 'Recenzii', icon: Star }
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [statusesRes, locationsRes, employeesRes, subscriptionRes] = await Promise.all([
        axios.get(`${API}/tenant/custom-statuses`, config),
        axios.get(`${API}/tenant/locations`, config),
        axios.get(`${API}/tenant/employees`, config),
        axios.get(`${API}/tenant/subscription-status`, config)
      ]);
      setStatuses(statusesRes.data.statuses || []);
      setLocations(locationsRes.data);
      setEmployees(employeesRes.data);
      setSubscriptionData(subscriptionRes.data);
      
      // Fetch company info
      await fetchCompanyInfo();

      setSubscription({
        plan: 'Basic',
        status: 'active',
        price: 0,
        next_billing: '2025-11-19'
      });
      
      // Fetch AI config
      await fetchAIConfig();
      
      // Fetch roles and permissions
      await fetchRoles();
      await fetchPermissions();
      
      // Fetch integrations
      await fetchIntegrations();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  // ============ STATUS HANDLERS ============
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStatus) {
        // Update existing status
        await axios.put(`${API}/tenant/custom-statuses/${editingStatus.status_id}`, statusFormData, config);
        toast.success('Status actualizat cu succes!');
      } else {
        // Create new status
        await axios.post(`${API}/tenant/custom-statuses`, statusFormData, config);
      toast.success('Status adăugat cu succes!');
      }
      setStatusFormData({
        category: 'NOU',
        label: '',
        color: '#3b82f6',
        icon: 'circle',
        description: '',
        order: 0,
        is_final: false,
        requires_note: false
      });
      setStatusDialogOpen(false);
      setEditingStatus(null);
      fetchAllData();
    } catch (error) {
      console.error('Error saving status:', error);
      toast.error(error.response?.data?.detail || 'Eroare la salvarea statusului');
    }
  };

  const handleEditStatus = (status) => {
    setEditingStatus(status);
    setStatusFormData({
      category: status.category,
      label: status.label,
      color: status.color,
      icon: status.icon || 'circle',
      description: status.description || '',
      order: status.order || 0,
      is_final: status.is_final || false,
      requires_note: status.requires_note || false
    });
    setStatusDialogOpen(true);
  };

  const handleDeleteStatus = async (statusId) => {
    if (!window.confirm('Sigur vrei să ștergi acest status?')) return;
    try {
      await axios.delete(`${API}/tenant/custom-statuses/${statusId}`, config);
      toast.success('Status șters cu succes!');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting status:', error);
      toast.error(error.response?.data?.detail || 'Eroare la ștergerea statusului');
    }
  };

  // ============ LOCATION HANDLERS ============
  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tenant/locations`, locationFormData, config);
      toast.success('Locație adăugată cu succes!');
      setLocationFormData({ location_name: '', address: '', phone: '' });
      setLocationDialogOpen(false);
      fetchAllData();
    } catch (error) {
      console.error('Error creating location:', error);
      const errorMessage = error.response?.data?.detail || 'Eroare la adăugarea locației';
      
      if (error.response?.status === 403 && errorMessage.includes('Limita')) {
        toast.error('Limită atinsă!', {
          description: errorMessage,
          duration: 6000
        });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm('Sigur vrei să ștergi această locație?')) return;
    try {
      await axios.delete(`${API}/tenant/locations/${locationId}`, config);
      toast.success('Locație ștearsă cu succes!');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Eroare la ștergerea locației');
    }
  };

  // ============ EMPLOYEE HANDLERS ============
  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/tenant/employees`, employeeFormData, config);
      toast.success('Angajat adăugat cu succes!');
      setEmployeeFormData({ name: '', email: '', password: '', role: 'Receptie', location_id: '' });
      setEmployeeDialogOpen(false);
      fetchAllData();
    } catch (error) {
      console.error('Error creating employee:', error);
      const errorMessage = error.response?.data?.detail || 'Eroare la adăugarea angajatului';
      
      if (error.response?.status === 403 && errorMessage.includes('Limita')) {
        toast.error('Limită atinsă!', {
          description: errorMessage,
          duration: 6000
        });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteEmployee = async (userId) => {
    if (!window.confirm('Sigur vrei să ștergi acest angajat?')) return;
    try {
      await axios.delete(`${API}/tenant/employees/${userId}`, config);
      toast.success('Angajat șters cu succes!');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Eroare la ștergerea angajatului');
    }
  };

  // ============ COMPANY HANDLERS ============
  const fetchCompanyInfo = async () => {
    try {
      const res = await axios.get(`${API}/tenant/company-info`, config);
      setCompanyData(res.data);
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };

  const handleCompanyUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/tenant/company-info`, companyData, config);
      toast.success('Informații companie actualizate cu succes!');
      fetchCompanyInfo();
    } catch (error) {
      console.error('Error updating company info:', error);
      toast.error(error.response?.data?.detail || 'Eroare la actualizarea datelor');
    }
  };

  // ============ AI CONFIGURATION HANDLERS ============
  const fetchAIConfig = async () => {
    try {
      const res = await axios.get(`${API}/ai/config`, config);
      setAiConfig(res.data);
    } catch (error) {
      console.error('Error fetching AI config:', error);
      // Use default config if not found
    }
  };

  const handleAIConfigUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/ai/config`, aiConfig, config);
      toast.success('Configurare AI actualizată cu succes!');
    } catch (error) {
      console.error('Error updating AI config:', error);
      toast.error('Eroare la actualizarea configurării AI');
    }
  };

  const handleAIConfigChange = (field, value) => {
    setAiConfig(prev => ({ ...prev, [field]: value }));
  };

  // ============ ROLES HANDLERS ============
  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API}/tenant/roles`, config);
      setRoles(res.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await axios.get(`${API}/tenant/permissions`, config);
      setPermissions(res.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        // Update existing role
        await axios.put(`${API}/tenant/roles/${editingRole.role_id}`, {
          name: roleFormData.name,
          description: roleFormData.description,
          permissions: roleFormData.permissions
        }, config);
        toast.success('Rol actualizat cu succes!');
      } else {
        // Create new role
        await axios.post(`${API}/tenant/roles`, roleFormData, config);
        toast.success('Rol creat cu succes!');
      }
      setRoleFormData({ role_id: '', name: '', description: '', permissions: [] });
      setRoleDialogOpen(false);
      setEditingRole(null);
      fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error(error.response?.data?.detail || 'Eroare la salvarea rolului');
    }
  };

  const handleEditRole = (role) => {
    if (role.is_system) {
      toast.error('Rolurile de sistem nu pot fi modificate');
      return;
    }
    setEditingRole(role);
    setRoleFormData({
      role_id: role.role_id,
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setRoleDialogOpen(true);
  };

  const handleDeleteRole = async (roleId, isSystem, usersCount) => {
    if (isSystem) {
      toast.error('Rolurile de sistem nu pot fi șterse');
      return;
    }
    if (usersCount > 0) {
      toast.error(`Nu poți șterge un rol cu ${usersCount} utilizatori activi`);
      return;
    }
    if (!window.confirm('Sigur vrei să ștergi acest rol?')) return;
    try {
      await axios.delete(`${API}/tenant/roles/${roleId}`, config);
      toast.success('Rol șters cu succes!');
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error(error.response?.data?.detail || 'Eroare la ștergerea rolului');
    }
  };

  // ============ INTEGRATIONS HANDLERS ============
  const fetchIntegrations = async () => {
    try {
      const res = await axios.get(`${API}/tenant/integrations`, config);
      setIntegrations(res.data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      // Use default state if error
    }
  };

  const handleWhatsAppConfigUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/tenant/integrations/whatsapp`, {
        phone_number_id: integrations.whatsapp.phone_number_id,
        access_token: integrations.whatsapp.access_token,
        business_account_id: integrations.whatsapp.business_account_id,
        enabled: integrations.whatsapp.enabled
      }, config);
      
      toast.success('Configurarea WhatsApp a fost salvată cu succes!');
      await fetchIntegrations();
    } catch (error) {
      console.error('Error updating WhatsApp config:', error);
      toast.error('Eroare la salvarea configurării WhatsApp');
    }
  };

  const handleWhatsAppTest = async () => {
    try {
      const res = await axios.post(`${API}/tenant/integrations/whatsapp/test`, {}, config);
      
      if (res.data.success) {
        toast.success('✅ Test WhatsApp reușit! Conexiunea funcționează.');
        await fetchIntegrations(); // Refresh to get updated webhook_verified status
      } else {
        toast.error(`❌ Test WhatsApp eșuat: ${res.data.message}`);
      }
    } catch (error) {
      console.error('Error testing WhatsApp:', error);
      toast.error('Eroare la testarea conexiunii WhatsApp');
    }
  };

  const handleIntegrationChange = (integrationType, field, value) => {
    setIntegrations(prev => ({
      ...prev,
      [integrationType]: {
        ...prev[integrationType],
        [field]: value
      }
    }));
  };

  const handlePermissionToggle = (permission) => {
    setRoleFormData(prev => {
      const perms = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions: perms };
    });
  };

  const groupedStatuses = statuses.reduce((acc, status) => {
    if (!acc[status.category]) {
      acc[status.category] = [];
    }
    acc[status.category].push(status);
    return acc;
  }, {});

  const getRoleColor = (role) => {
    const colors = {
      'Receptie': 'bg-blue-500',
      'Manager': 'bg-purple-500',
      'Technician': 'bg-green-500'
    };
    return colors[role] || 'bg-gray-500';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'brand':
  return (
          <Card className="glass-effect border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Building2 className="w-6 h-6 mr-3 text-cyan-400" />
                Informații Companie
              </CardTitle>
              <CardDescription className="text-slate-400">
                Actualizează detaliile companiei tale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanyUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
                    <Label className="text-slate-300">Nume Companie</Label>
                    <Input
                      value={companyData.company_name}
                      onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
        </div>
                  <div>
                    <Label className="text-slate-300">Nume Service</Label>
                    <Input
                      value={companyData.service_name}
                      onChange={(e) => setCompanyData({ ...companyData, service_name: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">CUI</Label>
                    <Input
                      value={companyData.cui}
                      onChange={(e) => setCompanyData({ ...companyData, cui: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Telefon</Label>
                    <Input
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Email</Label>
                    <Input
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Adresă</Label>
                    <Input
                      value={companyData.address}
                      onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Website (opțional)</Label>
                    <Input
                      value={companyData.website || ''}
                      onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                      placeholder="https://www.exemplu.ro"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Logo Companie (opțional)</Label>
                  <Input
                    value={companyData.logo_url || ''}
                    onChange={(e) => setCompanyData({ ...companyData, logo_url: e.target.value })}
                    placeholder="URL logo (ex: https://exemplu.ro/logo.png)"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-400 mt-1">Introdu URL-ul imaginii logo sau calea către fișier</p>
                </div>
                <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-500">
                  Salvează Modificările
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case 'account':
        return (
          <Card className="glass-effect border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <UserCircle className="w-6 h-6 mr-3 text-cyan-400" />
                Contul Meu
              </CardTitle>
              <CardDescription className="text-slate-400">
                Gestionează informațiile contului tău
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Nume Complet</Label>
                <Input
                  value={localStorage.getItem('fixgsm_name') || ''}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Email</Label>
                <Input
                  type="email"
                  value="office@brandmobile.ro"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Schimbă Parola</Label>
                <Input
                  type="password"
                  placeholder="Parolă nouă"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Confirmă Parola</Label>
                <Input
                  type="password"
                  placeholder="Confirmă parola nouă"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
                Actualizează Contul
              </Button>
            </CardContent>
          </Card>
        );

      case 'subscription':
        return (
          <Card className="glass-effect border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="w-6 h-6 mr-3 text-cyan-400" />
                Abonament & Plată
              </CardTitle>
              <CardDescription className="text-slate-400">
                Gestionează planul și metodele de plată
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Subscription Status */}
              <SubscriptionStatusCard />

              <PlanCards />

              {/* Payment History */}
              <PaymentHistory />
            </CardContent>
          </Card>
        );

      case 'ai-config':
        return (
          <Card className="glass-effect border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sparkles className="w-6 h-6 mr-3 text-cyan-400" />
                Configurare AI Assistant
              </CardTitle>
              <CardDescription className="text-slate-400">
                Personalizează comportamentul AI Assistant-ului pentru organizația ta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAIConfigUpdate} className="space-y-6">
                {/* AI Enabled Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div>
                    <Label className="text-white font-semibold">Activează AI Assistant</Label>
                    <p className="text-sm text-slate-400 mt-1">Permite utilizarea AI-ului pentru asistență tehnică</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiConfig.enabled}
                      onChange={(e) => handleAIConfigChange('enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>

                {/* Tone Selection */}
                <div>
                  <Label className="text-slate-300">Ton de Comunicare</Label>
                  <Select 
                    value={aiConfig.tone} 
                    onValueChange={(value) => handleAIConfigChange('tone', value)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Selectează tonul" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="professional" className="text-white hover:bg-slate-700">
                        Profesional - Comunicare exactă și orientată spre soluții
                      </SelectItem>
                      <SelectItem value="friendly" className="text-white hover:bg-slate-700">
                        Prietenos - Accesibil și ușor de înțeles
                      </SelectItem>
                      <SelectItem value="technical" className="text-white hover:bg-slate-700">
                        Tehnic - Terminologie avansată, coleg de service
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Detail Level Selection */}
                <div>
                  <Label className="text-slate-300">Nivel de Detaliu</Label>
                  <Select 
                    value={aiConfig.detail_level} 
                    onValueChange={(value) => handleAIConfigChange('detail_level', value)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Selectează nivelul de detaliu" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="brief" className="text-white hover:bg-slate-700">
                        Concis - Doar esențialul
                      </SelectItem>
                      <SelectItem value="balanced" className="text-white hover:bg-slate-700">
                        Echilibrat - Balans între detalii și concizie
                      </SelectItem>
                      <SelectItem value="detailed" className="text-white hover:bg-slate-700">
                        Detaliat - Explicații complete cu checklist-uri
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Response Format Selection */}
                <div>
                  <Label className="text-slate-300">Format Răspuns</Label>
                  <Select 
                    value={aiConfig.response_format} 
                    onValueChange={(value) => handleAIConfigChange('response_format', value)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Selectează formatul" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="structured" className="text-white hover:bg-slate-700">
                        Structurat - Liste, bullet points, pași numerotați
                      </SelectItem>
                      <SelectItem value="conversational" className="text-white hover:bg-slate-700">
                        Conversațional - Răspunsuri naturale, fluide
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto-learn Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div>
                    <Label className="text-white font-semibold">Învățare Automată</Label>
                    <p className="text-sm text-slate-400 mt-1">AI-ul va memoriza soluții și rezolvări din conversații</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiConfig.auto_learn}
                      onChange={(e) => handleAIConfigChange('auto_learn', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>

                {/* Custom Prompt */}
                <div>
                  <Label className="text-slate-300">Instrucțiuni Personalizate (opțional)</Label>
                  <Textarea
                    value={aiConfig.custom_prompt}
                    onChange={(e) => handleAIConfigChange('custom_prompt', e.target.value)}
                    placeholder="Adaugă instrucțiuni specifice pentru AI (ex: 'Menționează întotdeauna garanția', 'Recomandă piese originale')"
                    className="bg-slate-800 border-slate-700 text-white h-32"
                  />
                  <p className="text-xs text-slate-400 mt-1">Aceste instrucțiuni vor avea prioritate în comportamentul AI-ului</p>
                </div>

                {/* Preview Section */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-cyan-400" />
                    Previzualizare Configurare
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-300">
                      <span className="font-semibold">Status:</span> {aiConfig.enabled ? '✓ Activ' : '✗ Dezactivat'}
                    </p>
                    <p className="text-slate-300">
                      <span className="font-semibold">Ton:</span> {
                        aiConfig.tone === 'professional' ? 'Profesional' : 
                        aiConfig.tone === 'friendly' ? 'Prietenos' : 
                        'Tehnic'
                      }
                    </p>
                    <p className="text-slate-300">
                      <span className="font-semibold">Detaliu:</span> {
                        aiConfig.detail_level === 'brief' ? 'Concis' : 
                        aiConfig.detail_level === 'balanced' ? 'Echilibrat' : 
                        'Detaliat'
                      }
                    </p>
                    <p className="text-slate-300">
                      <span className="font-semibold">Format:</span> {
                        aiConfig.response_format === 'structured' ? 'Structurat' : 
                        'Conversațional'
                      }
                    </p>
                    <p className="text-slate-300">
                      <span className="font-semibold">Învățare:</span> {aiConfig.auto_learn ? '✓ Activă' : '✗ Dezactivată'}
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Salvează Configurarea AI
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case 'locations':
        // Check if location limit is reached
        const hasReachedLocationLimit = subscriptionData?.plan_limits && 
          locations.length >= subscriptionData.plan_limits.locations;
        
        return (
          <div className="space-y-6">
            {/* Plan Limit Warning */}
            {hasReachedLocationLimit && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <div className="text-amber-400 mt-0.5">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm mb-1">Limită Locații Atinsă</h3>
                  <p className="text-slate-300 text-sm">
                    Ai atins limita de <span className="font-semibold text-amber-400">{subscriptionData.plan_limits.locations} {subscriptionData.plan_limits.locations === 1 ? 'locație' : 'locații'}</span> pentru planul tău curent. 
                    Fă upgrade la <span className="font-semibold text-amber-400">Pro</span> sau <span className="font-semibold text-amber-400">Enterprise</span> pentru mai multe locații.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="text-amber-400 hover:bg-amber-500/10 px-3"
                  onClick={() => setActiveTab('subscription')}
                >
                  Upgrade
                </Button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Locații Service</h2>
                <p className="text-slate-400">Gestionează punctele tale de lucru</p>
              </div>
              <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Adaugă Locație
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-effect border border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>Locație Nouă</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Adaugă un punct de lucru nou
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleLocationSubmit} className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Nume Locație</Label>
                  <Input
                        value={locationFormData.location_name}
                        onChange={(e) => setLocationFormData({ ...locationFormData, location_name: e.target.value })}
                    required
                        placeholder="Service Central"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                      <Label className="text-slate-300">Adresă</Label>
                      <Input
                        value={locationFormData.address}
                        onChange={(e) => setLocationFormData({ ...locationFormData, address: e.target.value })}
                        required
                        placeholder="Str. Exemplu Nr. 123"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Telefon</Label>
                    <Input
                        value={locationFormData.phone}
                        onChange={(e) => setLocationFormData({ ...locationFormData, phone: e.target.value })}
                        required
                        placeholder="0712345678"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500">
                      Salvează
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <Card key={location.location_id} className="glass-effect border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-cyan-400" />
                        {location.location_name}
                </div>
                <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLocation(location.location_id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-300 space-y-2">
                    <p className="text-sm">{location.address}</p>
                    <p className="text-sm">{location.phone}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'users':
        // Check if employee limit is reached
        const hasReachedEmployeeLimit = subscriptionData?.plan_limits && 
          employees.length >= subscriptionData.plan_limits.employees;
        
        return (
          <div className="space-y-6">
            {/* Plan Limit Warning */}
            {hasReachedEmployeeLimit && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                <div className="text-amber-400 mt-0.5">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm mb-1">Limită Angajați Atinsă</h3>
                  <p className="text-slate-300 text-sm">
                    Ai atins limita de <span className="font-semibold text-amber-400">{subscriptionData.plan_limits.employees} angajați</span> pentru planul tău curent. 
                    Fă upgrade la <span className="font-semibold text-amber-400">Pro</span> sau <span className="font-semibold text-amber-400">Enterprise</span> pentru mai mulți angajați.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="text-amber-400 hover:bg-amber-500/10 px-3"
                  onClick={() => setActiveTab('subscription')}
                >
                  Upgrade
                </Button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Utilizatori</h2>
                <p className="text-slate-400">Gestionează echipa ta</p>
              </div>
              <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Adaugă Utilizator
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-effect border border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>Utilizator Nou</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Adaugă un membru nou în echipă
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Nume</Label>
                      <Input
                        value={employeeFormData.name}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                        required
                        placeholder="Ion Popescu"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Email</Label>
                      <Input
                        type="email"
                        value={employeeFormData.email}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                        required
                        placeholder="ion@example.com"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Parolă</Label>
                      <Input
                        type="password"
                        value={employeeFormData.password}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, password: e.target.value })}
                        required
                        placeholder="••••••••"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Rol</Label>
                      <Select
                        value={employeeFormData.role}
                        onValueChange={(value) => setEmployeeFormData({ ...employeeFormData, role: value })}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="Receptie" className="text-white">Recepție</SelectItem>
                          <SelectItem value="Technician" className="text-white">Tehnician</SelectItem>
                          <SelectItem value="Manager" className="text-white">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
        <div>
                      <Label className="text-slate-300">Locație</Label>
                      <Select
                        value={employeeFormData.location_id}
                        onValueChange={(value) => setEmployeeFormData({ ...employeeFormData, location_id: value })}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
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
                    <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500">
                      Salvează
                </Button>
              </form>
                </DialogContent>
              </Dialog>
        </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((employee) => (
                <Card key={employee.user_id} className="glass-effect border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        {employee.name}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEmployee(employee.user_id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-slate-300 text-sm">{employee.email}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getRoleColor(employee.role)} text-white`}>
                        {employee.role}
                      </Badge>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {locations.find(l => l.location_id === employee.location_id)?.location_name || 'N/A'}
                      </Badge>
                    </div>
            </CardContent>
          </Card>
              ))}
            </div>
          </div>
        );

      case 'roles':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Gestionare Roluri & Permisiuni</h2>
                <p className="text-slate-400">Configurează rolurile și permisiunile pentru echipa ta</p>
              </div>
              <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-cyan-500 to-blue-500"
                    onClick={() => {
                      setEditingRole(null);
                      setRoleFormData({ role_id: '', name: '', description: '', permissions: [] });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Rol Personalizat Nou
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingRole ? 'Editează Rol' : 'Adaugă Rol Nou'}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {editingRole ? 'Modifică permisiunile pentru acest rol' : 'Creează un rol personalizat cu permisiuni specifice'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRoleSubmit} className="space-y-6">
                    {!editingRole && (
                      <div>
                        <Label className="text-slate-300">ID Rol (unic)</Label>
                        <Input
                          value={roleFormData.role_id}
                          onChange={(e) => setRoleFormData({ ...roleFormData, role_id: e.target.value })}
                          required
                          placeholder="ex: receptionist_senior"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    )}
                    <div>
                      <Label className="text-slate-300">Nume Rol</Label>
                      <Input
                        value={roleFormData.name}
                        onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                        required
                        placeholder="ex: Recepționer Senior"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Descriere</Label>
                      <Textarea
                        value={roleFormData.description}
                        onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                        placeholder="Descrie responsabilitățile acestui rol"
                        className="bg-slate-800 border-slate-700 text-white"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-slate-300 mb-3 block">Permisiuni</Label>
                      <div className="space-y-4">
                        {Object.entries(permissions).map(([category, perms]) => (
                          perms.length > 0 && (
                            <div key={category} className="bg-slate-800/50 rounded-lg p-4">
                              <h4 className="text-white font-semibold mb-3 capitalize">{category}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {perms.map((perm) => (
                                  <label key={perm.value} className="flex items-center space-x-2 text-slate-300 cursor-pointer hover:bg-slate-700/30 p-2 rounded">
                                    <input
                                      type="checkbox"
                                      checked={roleFormData.permissions.includes(perm.value)}
                                      onChange={() => handlePermissionToggle(perm.value)}
                                      className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
                                    />
                                    <span className="text-sm">{perm.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500">
                      {editingRole ? 'Actualizează Rol' : 'Creează Rol'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <Card key={role.role_id} className="glass-effect border border-white/10 hover:border-cyan-500/30 transition-all">
            <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mr-3">
                          <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-lg">{role.name}</p>
                          {role.is_system && (
                            <Badge className="bg-purple-500/20 text-purple-300 text-xs mt-1">Sistem</Badge>
                          )}
                        </div>
                      </div>
                      {!role.is_system && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRole(role)}
                            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                          >
                            <Palette className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRole(role.role_id, role.is_system, role.users_count)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      {role.description || 'Fără descriere'}
              </CardDescription>
            </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Utilizatori:</span>
                      <Badge className="bg-slate-700 text-white">{role.users_count || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Permisiuni:</span>
                      <Badge className="bg-slate-700 text-white">{role.permissions.length}</Badge>
                    </div>
                    <div className="pt-2 border-t border-slate-700">
                      <p className="text-xs text-slate-400 mb-2">Permisiuni cheie:</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 4).map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs text-cyan-300 border-cyan-500/30">
                            {perm.split('_')[0]}
                          </Badge>
                        ))}
                        {role.permissions.length > 4 && (
                          <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                            +{role.permissions.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Integrări Platforme</h2>
              <p className="text-slate-400">Configurează integrările cu servicii externe pentru automatizare</p>
            </div>

            {/* WhatsApp Business API */}
            <Card className="glass-effect border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageSquare className="w-6 h-6 mr-3 text-green-400" />
                  WhatsApp Business API
                  {integrations.whatsapp.webhook_verified && (
                    <Badge className="ml-2 bg-green-500/20 text-green-300 border-green-500/30">
                      ✓ Verificat
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configurează WhatsApp pentru trimiterea automată de mesaje către clienți
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-green-400 mt-0.5">💡</div>
                    <div>
                      <h4 className="text-green-300 font-semibold mb-1">Cum funcționează?</h4>
                      <p className="text-slate-300 text-sm">
                        Configurează API-ul WhatsApp Business pentru a trimite mesaje automate către clienți. 
                        Fiecare tenant poate configura propriile credențiale WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleWhatsAppConfigUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Phone Number ID</Label>
                      <Input
                        value={integrations.whatsapp.phone_number_id}
                        onChange={(e) => handleIntegrationChange('whatsapp', 'phone_number_id', e.target.value)}
                        placeholder="123456789012345"
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                      />
                      <p className="text-xs text-slate-400 mt-1">ID-ul numărului de telefon din WhatsApp Business</p>
                    </div>
                    <div>
                      <Label className="text-slate-300">Access Token</Label>
                      <Input
                        type="password"
                        value={integrations.whatsapp.access_token}
                        onChange={(e) => handleIntegrationChange('whatsapp', 'access_token', e.target.value)}
                        placeholder="EAAxxxxxxxxxxxxx"
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                      />
                      <p className="text-xs text-slate-400 mt-1">Token-ul de acces pentru WhatsApp Business API</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300">Business Account ID</Label>
                    <Input
                      value={integrations.whatsapp.business_account_id}
                      onChange={(e) => handleIntegrationChange('whatsapp', 'business_account_id', e.target.value)}
                      placeholder="123456789012345"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">ID-ul contului de business WhatsApp (opțional)</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div>
                      <Label className="text-white font-semibold">Activează WhatsApp</Label>
                      <p className="text-sm text-slate-400 mt-1">Permite trimiterea automată de mesaje WhatsApp</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integrations.whatsapp.enabled}
                        onChange={(e) => handleIntegrationChange('whatsapp', 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Salvează Configurarea
                    </Button>
                    <Button 
                      type="button"
                      onClick={handleWhatsAppTest}
                      variant="outline"
                      className="border-green-500/30 text-green-300 hover:bg-green-500/20"
                      disabled={!integrations.whatsapp.phone_number_id || !integrations.whatsapp.access_token}
                    >
                      Testează Conexiunea
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* SmartBill Integration */}
            <Card className="glass-effect border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-blue-400" />
                  SmartBill API
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Integrează cu SmartBill pentru generarea automată de facturi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-400 mt-0.5">📋</div>
                    <div>
                      <h4 className="text-blue-300 font-semibold mb-1">În dezvoltare</h4>
                      <p className="text-slate-300 text-sm">
                        Integrarea cu SmartBill va permite generarea automată de facturi și gestionarea contabilității.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">SmartBill API Key</Label>
                  <Input
                    placeholder="În curând disponibil..."
                    disabled
                    className="bg-slate-800 border-slate-700 text-slate-500"
                  />
                </div>

                <Button disabled className="w-full bg-slate-700 text-slate-400 cursor-not-allowed">
                  <FileText className="w-4 h-4 mr-2" />
                  În dezvoltare
                </Button>
              </CardContent>
            </Card>

            {/* SMS Gateway */}
            <Card className="glass-effect border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageSquare className="w-6 h-6 mr-3 text-purple-400" />
                  SMS Gateway
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configurează serviciul SMS pentru notificări automate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-purple-400 mt-0.5">📱</div>
                    <div>
                      <h4 className="text-purple-300 font-semibold mb-1">În dezvoltare</h4>
                      <p className="text-slate-300 text-sm">
                        Integrarea cu servicii SMS va permite trimiterea de notificări automate către clienți.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">SMS Provider</Label>
                  <Select disabled>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-500">
                      <SelectValue placeholder="În curând disponibil..." />
                    </SelectTrigger>
                  </Select>
                </div>

                <Button disabled className="w-full bg-slate-700 text-slate-400 cursor-not-allowed">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  În dezvoltare
                </Button>
              </CardContent>
            </Card>

            {/* Email SMTP */}
            <Card className="glass-effect border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Mail className="w-6 h-6 mr-3 text-cyan-400" />
                  Email SMTP
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configurează serverul SMTP pentru trimiterea de emailuri automate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-cyan-400 mt-0.5">📧</div>
                    <div>
                      <h4 className="text-cyan-300 font-semibold mb-1">În dezvoltare</h4>
                      <p className="text-slate-300 text-sm">
                        Configurarea SMTP va permite trimiterea de emailuri automate către clienți și echipă.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">SMTP Server</Label>
                    <Input
                      placeholder="În curând disponibil..."
                      disabled
                      className="bg-slate-800 border-slate-700 text-slate-500"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Port</Label>
                    <Input
                      placeholder="587"
                      disabled
                      className="bg-slate-800 border-slate-700 text-slate-500"
                    />
                  </div>
                </div>

                <Button disabled className="w-full bg-slate-700 text-slate-400 cursor-not-allowed">
                  <Mail className="w-4 h-4 mr-2" />
                  În dezvoltare
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'statuses':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Gestionare Statusuri</h2>
                <p className="text-slate-400">Configurează statusuri personalizate pentru workflow-ul tău</p>
              </div>
              <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Adaugă Status
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-effect border border-white/10 text-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingStatus ? 'Editează Status' : 'Status Nou'}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {editingStatus ? 'Modifică detaliile statusului' : 'Creează un status personalizat pentru workflow-ul tău'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleStatusSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Categorie</Label>
                        <Select
                          value={statusFormData.category}
                          onValueChange={(value) => setStatusFormData({ ...statusFormData, category: value })}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue>
                              {statusFormData.category === 'NOU' && <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-blue-500/20 text-blue-300">📥 NOU</span>}
                              {statusFormData.category === 'INLUCRU' && <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-orange-500/20 text-orange-300">🔧 ÎN LUCRU</span>}
                              {statusFormData.category === 'INASTEPTARE' && <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-300">⏳ ÎN AȘTEPTARE</span>}
                              {statusFormData.category === 'FINALIZAT' && <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-green-500/20 text-green-300">🎉 FINALIZAT</span>}
                              {statusFormData.category === 'CASTIGAT' && <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300">💰 CÂȘTIGAT</span>}
                              {statusFormData.category === 'PIERDUT' && <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-red-500/20 text-red-300">❌ PIERDUT</span>}
                              {statusFormData.category === 'CURIER' && <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-purple-500/20 text-purple-300">🚚 CURIER</span>}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="NOU" className="text-white hover:bg-blue-500/10">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500/20 text-blue-300 font-medium">📥 NOU</span>
                            </SelectItem>
                            <SelectItem value="INLUCRU" className="text-white hover:bg-orange-500/10">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-orange-500/20 text-orange-300 font-medium">🔧 ÎN LUCRU</span>
                            </SelectItem>
                            <SelectItem value="INASTEPTARE" className="text-white hover:bg-yellow-500/10">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-yellow-500/20 text-yellow-300 font-medium">⏳ ÎN AȘTEPTARE</span>
                            </SelectItem>
                            <SelectItem value="FINALIZAT" className="text-white hover:bg-green-500/10">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-500/20 text-green-300 font-medium">🎉 FINALIZAT</span>
                            </SelectItem>
                            <SelectItem value="CASTIGAT" className="text-white hover:bg-emerald-500/10">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-300 font-medium">💰 CÂȘTIGAT</span>
                            </SelectItem>
                            <SelectItem value="PIERDUT" className="text-white hover:bg-red-500/10">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-500/20 text-red-300 font-medium">❌ PIERDUT</span>
                            </SelectItem>
                            <SelectItem value="CURIER" className="text-white hover:bg-purple-500/10">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-500/20 text-purple-300 font-medium">🚚 CURIER</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-300">Etichetă Status</Label>
                        <Input
                          value={statusFormData.label}
                          onChange={(e) => setStatusFormData({ ...statusFormData, label: e.target.value })}
                          required
                          placeholder="ex: În Laborator"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Culoare</Label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={statusFormData.color}
                            onChange={(e) => setStatusFormData({ ...statusFormData, color: e.target.value })}
                            className="w-12 h-12 rounded cursor-pointer"
                          />
                          <Input
                            value={statusFormData.color}
                            onChange={(e) => setStatusFormData({ ...statusFormData, color: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300">Icon</Label>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700 flex items-center justify-center gap-2"
                            >
                              {statusFormData.icon && statusFormData.icon.length <= 2 ? (
                                <>
                                  <span className="text-2xl">{statusFormData.icon}</span>
                                  <span>Emoji</span>
                                </>
                              ) : (
                                <>
                                  <span>📱</span>
                                  <span>Emoji</span>
                                </>
                              )}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-effect border border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Selectează Emoji GSM</DialogTitle>
                              <DialogDescription className="text-slate-400">
                                Alege un emoji pentru statusul tău
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-10 gap-2 p-4">
                              {[
                                '📱', '📲', '📞', '☎️', '💬', '📧', '🔋', '🔌', '⚡', '🪫',
                                '📡', '📶', '🛜', '🔊', '🔇', '📳', '📴', '🔔', '🔕', '📢',
                                '🔧', '⚙️', '🛠️', '🔩', '🔨', '⚒️', '🪛', '⚗️', '🧰', '🔬',
                                '🖥️', '💻', '⌨️', '🖱️', '🖨️', '📀', '💾', '💿', '📹', '📷',
                                '🎨', '🖼️', '📊', '📈', '📉', '📋', '📝', '📄', '📑', '📌',
                                '✅', '✔️', '❌', '❎', '⚠️', '⛔', '🚫', '🔴', '🟡', '🟢',
                                '🔵', '🟣', '⚪', '⚫', '🟤', '🔶', '🔷', '🔸', '🔹', '💠',
                                '⭐', '🌟', '💫', '✨', '💥', '🔥', '💢', '💯', '🎯', '🎪',
                                '📥', '📤', '📦', '📫', '📪', '📬', '📭', '🗂️', '🗃️', '🗄️',
                                '🚚', '🚛', '📮', '🏪', '🏢', '🏭', '🏗️', '🏛️', '🏦', '🏬'
                              ].map(emoji => (
                                <DialogClose key={emoji} asChild>
                                  <button
                                    type="button"
                                    onClick={() => setStatusFormData({ ...statusFormData, icon: emoji })}
                                    className={`text-3xl hover:bg-slate-700 rounded p-2 transition-colors ${
                                      statusFormData.icon === emoji ? 'bg-cyan-500/20 ring-2 ring-cyan-500' : ''
                                    }`}
                                    title={emoji}
                                  >
                                    {emoji}
                                  </button>
                                </DialogClose>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-300">Descriere</Label>
                      <Textarea
                        value={statusFormData.description || ''}
                        onChange={(e) => setStatusFormData({ ...statusFormData, description: e.target.value })}
                        placeholder="Descriere detalată a statusului..."
                        className="bg-slate-800 border-slate-700 text-white"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label className="text-slate-300">Ordine afișare (număr mai mic = prioritate mai mare)</Label>
                      <Input
                        type="number"
                        value={statusFormData.order || 0}
                        onChange={(e) => setStatusFormData({ ...statusFormData, order: parseInt(e.target.value) || 0 })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_final"
                          checked={statusFormData.is_final || false}
                          onCheckedChange={(checked) => setStatusFormData({ ...statusFormData, is_final: checked })}
                          className="border-slate-600"
                        />
                        <Label htmlFor="is_final" className="text-slate-300 cursor-pointer">
                          Status final (închide tichetul)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requires_note"
                          checked={statusFormData.requires_note || false}
                          onCheckedChange={(checked) => setStatusFormData({ ...statusFormData, requires_note: checked })}
                          className="border-slate-600"
                        />
                        <Label htmlFor="requires_note" className="text-slate-300 cursor-pointer">
                          Necesită notă obligatorie
                        </Label>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button type="submit" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500">
                        {editingStatus ? 'Actualizează' : 'Creează'} Status
                      </Button>
                      {editingStatus && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setStatusDialogOpen(false);
                            setEditingStatus(null);
                            setStatusFormData({ category: 'NOU', label: '', color: '#3b82f6' });
                          }}
                          className="border-slate-600 text-slate-300"
                        >
                          Anulează
                        </Button>
                      )}
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

              {loading ? (
              <div className="text-white text-center py-12">Se încarcă statusuri...</div>
              ) : Object.keys(groupedStatuses).length === 0 ? (
              <Card className="glass-effect border border-white/10">
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="w-10 h-10 text-slate-600" />
                </div>
                    <p className="text-slate-400 mb-4">Nu există statusuri configurate</p>
                    <Button
                      onClick={() => setStatusDialogOpen(true)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adaugă primul status
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedStatuses).map(([category, categoryStatuses]) => (
                  <div key={category}>
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-1 rounded-lg text-sm mr-3">
                        {category}
                      </span>
                      <span className="text-slate-400 text-sm">({categoryStatuses.length} statusuri)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryStatuses.map((status, index) => (
                        <Card key={status.status_id || `${status.category}-${status.label}-${index}`} className="glass-effect border border-white/10 hover:border-cyan-500/30 transition-colors">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-white flex items-center justify-between text-base">
                              <div className="flex items-center space-x-2">
                                {status.icon && <span className="text-xl">{status.icon}</span>}
                                <span>{status.label}</span>
                              </div>
                              {status.status_id && (
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditStatus(status)}
                                    className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                  >
                                    <Palette className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteStatus(status.status_id)}
                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-sm">Preview:</span>
                            <Badge
                              className="text-white"
                              style={{ backgroundColor: status.color }}
                            >
                                {status.icon && <span className="mr-1">{status.icon}</span>}
                              {status.label}
                            </Badge>
                          </div>
                            
                            {status.description && (
                              <p className="text-slate-400 text-xs italic border-l-2 border-slate-700 pl-3">
                                {status.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700">
                              <span className="text-slate-500">Ordine: {status.order || 0}</span>
                              <div className="flex items-center space-x-2">
                                {status.is_final && (
                                  <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                                    Final
                                  </Badge>
                                )}
                                {status.requires_note && (
                                  <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500/30">
                                    Notă req.
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        );

      default:
        return (
          <Card className="glass-effect border border-white/10">
            <CardHeader>
              <CardTitle className="text-white capitalize">{activeTab}</CardTitle>
              <CardDescription className="text-slate-400">
                Această secțiune va fi implementată în curând
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-10 h-10 text-slate-600" />
                </div>
                <p className="text-slate-400">În dezvoltare...</p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            Setări
          </h1>
          <p className="text-slate-400">Configurează și gestionează serviciul tău</p>
        </div>

        {/* Settings Layout */}
        <div className="flex gap-6">
          {/* Sidebar Menu */}
          <div className="w-64 flex-shrink-0">
            <Card className="glass-effect border border-white/10 sticky top-6">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          activeTab === item.id
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                            : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;

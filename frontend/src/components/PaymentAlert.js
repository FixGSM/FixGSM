import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X, CreditCard, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentAlert = () => {
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  
  const token = localStorage.getItem('fixgsm_token');
  const tenantName = localStorage.getItem('fixgsm_name') || 'Tenant';
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API}/tenant/subscription-status`, config);
      setSubscriptionStatus(response.data);
      
      // Show alert if expiring soon OR has manual payment notification
      if (response.data.is_expiring_soon || response.data.has_payment_notification) {
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleDismiss = async () => {
    try {
      await axios.post(`${API}/tenant/dismiss-payment-alert`, {}, config);
      setShowAlert(false);
      toast.success('Notificarea a fost închisă');
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast.error('Eroare la închiderea notificării');
    }
  };

  const handleGoToPayment = () => {
    navigate('/settings', { state: { tab: 'subscriptions' } });
  };

  if (!showAlert || !subscriptionStatus) {
    return null;
  }

  const daysUntilExpiry = subscriptionStatus.days_until_expiry;
  const isExpiringSoon = subscriptionStatus.is_expiring_soon;
  const hasManualNotification = subscriptionStatus.has_payment_notification;

  return (
    <Card className="glass-effect border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10 mb-6 animate-pulse-subtle">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                Atenție la Abonament!
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                onClick={handleDismiss}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-3">
              {/* Main Message */}
              <p className="text-white text-lg">
                Salut <span className="font-bold text-amber-400">{tenantName}</span>,
              </p>
              
              {isExpiringSoon && (
                <p className="text-white/90">
                  Abonamentul tău <span className="font-bold text-amber-400">urmează să expire în {daysUntilExpiry} {daysUntilExpiry === 1 ? 'zi' : 'zile'}</span>! 
                  Pentru a nu fi suspendat contul, te rugăm să achiziționezi abonamentul cât mai curând.
                </p>
              )}
              
              {hasManualNotification && !isExpiringSoon && (
                <p className="text-white/90">
                  Te rugăm să verifici statusul abonamentului tău. Este posibil să fie necesară reînnoirea pentru a continua să folosești serviciile platformei.
                </p>
              )}

              {/* Subscription Details & Action Button */}
              <div className="flex items-center justify-between gap-6 p-4 bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="text-slate-400 text-xs">Expiră în</p>
                      <p className="text-white font-bold">{daysUntilExpiry} zile</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="text-slate-400 text-xs">Preț abonament</p>
                      <p className="text-white font-bold">{subscriptionStatus.subscription_price} €/lună</p>
                    </div>
                  </div>
                </div>

                {/* Action Button - Compact */}
                <Button
                  onClick={handleGoToPayment}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-2 h-auto rounded-lg shadow-lg shadow-amber-500/30 transition-all duration-300 hover:scale-[1.02] whitespace-nowrap"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Plătește Acum
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentAlert;


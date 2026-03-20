"use client";

import React, { useState, useEffect } from "react";
import { Check, Loader2, Rocket, Zap, Shield, Sparkles, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_LIMITS, SubscriptionTier } from "@/config/plans";
import { showError } from "@/utils/toast";

// ========================================================
// IDs DO STRIPE (price_...) - SUBSTITUA PELOS SEUS DE PRODUÇÃO
// ========================================================
const STRIPE_PRICE_IDS: Record<string, string> = {
  basic: "price_1TCriP2LdLLLIxeHYXAtYEFW", 
  pro: "price_1TCrkm2LdLLLIxeHJcrSxfam",   
  ultra: "price_1TCrm22LdLLLIxeH8tvbj2Nb", 
};

const Subscription = () => {
  const { user } = useAuth();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('subscription_tier, stripe_customer_id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data) {
          // Garantir que o tier existe no nosso objeto PLAN_LIMITS
          const tierFromDb = data.subscription_tier as SubscriptionTier;
          if (PLAN_LIMITS[tierFromDb]) {
            setCurrentTier(tierFromDb);
          } else {
            setCurrentTier('free');
          }
          setHasSubscription(!!data.stripe_customer_id);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleAction = async (tierId: SubscriptionTier) => {
    setSubmitting(tierId);
    try {
      const priceId = STRIPE_PRICE_IDS[tierId];
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          tier: tierId, 
          priceId: priceId || "",
          successUrl: window.location.origin + "/assinatura?success=true",
          cancelUrl: window.location.origin + "/assinatura?canceled=true",
        }
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url; 
    } catch (e: any) {
      showError(e.message || "Erro ao conectar com o financeiro.");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  const planCards: { id: SubscriptionTier; icon: any; color: string }[] = [
    { id: 'free', icon: Shield, color: 'text-slate-400' },
    { id: 'basic', icon: Zap, color: 'text-amber-500' },
    { id: 'pro', icon: Rocket, color: 'text-indigo-600' },
    { id: 'ultra', icon: Sparkles, color: 'text-purple-600' },
  ];

  // Dados do plano atual para o cabeçalho
  const currentPlanDetails = PLAN_LIMITS[currentTier] || PLAN_LIMITS.free;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Assinatura e Planos</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          {hasSubscription 
            ? "Gerencie sua assinatura, mude de plano ou atualize sua forma de pagamento através do portal seguro." 
            : "Escolha o melhor plano para sua prática clínica e comece agora."}
        </p>
      </div>

      {hasSubscription && (
        <div className="bg-indigo-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-indigo-100 mb-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl"><Sparkles className="h-6 w-6" /></div>
            <div>
              <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Assinatura Ativa</p>
              <h3 className="text-xl font-bold">Plano: {currentPlanDetails.name}</h3>
              <p className="text-indigo-100 text-xs mt-1 italic">Qualquer alteração feita no portal respeitará seu ciclo de faturamento atual.</p>
            </div>
          </div>
          <Button 
            className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-8 gap-2 shrink-0"
            onClick={() => handleAction(currentTier)}
            disabled={submitting !== null}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Gerenciar Assinatura
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {planCards.map((plan) => {
          const details = PLAN_LIMITS[plan.id];
          const isCurrent = currentTier === plan.id;
          const PlanIcon = plan.icon;

          const buttonText = isCurrent ? 'Plano Ativo' : (hasSubscription ? 'Alterar Plano' : 'Escolher Plano');

          return (
            <Card key={plan.id} className={`relative flex flex-col ${isCurrent ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-lg' : ''}`}>
              <CardHeader className="text-center pb-2">
                <div className={`mx-auto p-3 rounded-full bg-slate-50 w-fit mb-4 ${plan.color}`}>
                  <PlanIcon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{details.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">R$ {details.price.toFixed(2).replace('.', ',')}</span>
                  <span className="text-slate-500 text-sm">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 pt-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{details.maxPatients === Infinity ? 'Ilimitados' : `${details.maxPatients} pacientes`}</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{details.maxTranscriptionsPerMonth === Infinity ? 'Ilimitadas' : `${details.maxTranscriptionsPerMonth}`} transcrições</span>
                  </li>
                  {details.hasTherapeuticInsights && (
                    <li className="flex items-center gap-3 text-sm font-bold text-indigo-700">
                      <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span>Insights Terapêuticos</span>
                    </li>
                  )}
                </ul>
              </CardContent>
              <CardFooter className="pt-6">
                <Button 
                  className={`w-full ${isCurrent ? 'bg-slate-100 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  variant={isCurrent ? "secondary" : "default"}
                  disabled={(isCurrent && hasSubscription) || (plan.id === 'free' && !hasSubscription) || submitting !== null}
                  onClick={() => handleAction(plan.id)}
                >
                  {submitting === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : buttonText}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Subscription;
"use client";

import React, { useState, useEffect } from "react";
import { Check, Loader2, Rocket, Zap, Shield, Sparkles, X, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_LIMITS, SubscriptionTier } from "@/config/plans";
import { showSuccess, showError } from "@/utils/toast";

// MAPEAMENTO DE IDs DE PREÇO DO STRIPE (Substitua pelos seus IDs reais do Dashboard do Stripe)
const STRIPE_PRICE_IDS: Record<string, string> = {
  basic: "prod_UBEAgDzNMifEcG",
  pro: "prod_UBEDYfdMsYPhvy",
  ultra: "prod_UBEEcVuyNti71A",
};

const Subscription = () => {
  const { user } = useAuth();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    const fetchTier = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data?.subscription_tier) {
          setCurrentTier(data.subscription_tier as SubscriptionTier);
        }
      } catch (e) {
        console.error("Erro ao carregar plano:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTier();
  }, [user]);

  const handleSubscribe = async (tierId: SubscriptionTier) => {
    if (tierId === currentTier) return;
    
    // Plano gratuito apenas atualiza no banco (se permitido voltar atrás)
    if (tierId === 'free') {
      setSubmitting('free');
      await supabase.from('profiles').update({ subscription_tier: 'free' }).eq('id', user?.id);
      setCurrentTier('free');
      setSubmitting(null);
      return;
    }

    setSubmitting(tierId);
    try {
      const priceId = STRIPE_PRICE_IDS[tierId];
      if (!priceId || priceId.includes("_id_here")) {
        throw new Error("ID do preço não configurado. Por favor, configure o Stripe Price ID.");
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          tier: tierId, 
          priceId: priceId,
          successUrl: window.location.origin + "/assinatura?success=true",
          cancelUrl: window.location.origin + "/assinatura?canceled=true",
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url; // Redireciona para o Stripe
      }
    } catch (e: any) {
      showError(e.message || "Erro ao iniciar pagamento.");
      setSubmitting(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      showSuccess("Pagamento recebido! Seu plano será atualizado em instantes.");
      // Limpa a URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  const planCards: { id: SubscriptionTier; icon: any; color: string }[] = [
    { id: 'free', icon: Shield, color: 'text-slate-400' },
    { id: 'basic', icon: Zap, color: 'text-amber-500' },
    { id: 'pro', icon: Rocket, color: 'text-indigo-600' },
    { id: 'ultra', icon: Sparkles, color: 'text-purple-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Escolha seu Plano</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Potencialize sua prática clínica com inteligência artificial. 
          Assinatura mensal recorrente com cobrança automática via Stripe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {planCards.map((plan) => {
          const details = PLAN_LIMITS[plan.id];
          const isCurrent = currentTier === plan.id;
          const PlanIcon = plan.icon;

          return (
            <Card key={plan.id} className={`relative flex flex-col ${isCurrent ? 'border-indigo-600 shadow-indigo-100 shadow-xl' : ''}`}>
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-600">Plano Atual</Badge>
                </div>
              )}
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
                <p className="text-sm text-slate-500 text-center italic mb-4">{details.description}</p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Até <strong>{details.maxPatients === Infinity ? 'Ilimitados' : details.maxPatients}</strong> pacientes</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Sessões: <strong>{details.maxSessionsPerMonth === Infinity ? 'Ilimitadas' : details.maxSessionsPerMonth}</strong></span>
                  </li>
                  
                  {details.maxTranscriptionsPerMonth === 0 ? (
                    <li className="flex items-center gap-3 text-sm text-slate-400">
                      <X className="h-4 w-4 text-red-400 shrink-0" />
                      <span>Sem transcrição de áudio</span>
                    </li>
                  ) : (
                    <li className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Transcrições: <strong>{details.maxTranscriptionsPerMonth === Infinity ? 'Ilimitadas' : details.maxTranscriptionsPerMonth}</strong></span>
                    </li>
                  )}

                  {details.hasTherapeuticInsights ? (
                    <li className="flex items-center gap-3 text-sm font-bold text-indigo-700">
                      <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span>Insights Terapêuticos inclusos</span>
                    </li>
                  ) : (
                    <li className="flex items-center gap-3 text-sm text-slate-400">
                      <Lock className="h-4 w-4 text-slate-300 shrink-0" />
                      <span>Insights de IA bloqueados</span>
                    </li>
                  )}
                </ul>
              </CardContent>
              <CardFooter className="pt-6">
                <Button 
                  className={`w-full ${isCurrent ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  variant={isCurrent ? "secondary" : "default"}
                  disabled={isCurrent || submitting !== null}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {submitting === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isCurrent ? 'Plano Ativo' : 'Assinar Agora'}
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
"use client";

import React, { useState, useEffect } from "react";
import { Check, Loader2, Rocket, Zap, Shield, Sparkles, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_LIMITS, SubscriptionTier } from "@/config/plans";
import { showSuccess, showError } from "@/utils/toast";

const Subscription = () => {
  const { user } = useAuth();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    const fetchTier = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();
      
      if (data) setCurrentTier(data.subscription_tier as SubscriptionTier);
      setLoading(false);
    };
    fetchTier();
  }, [user]);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (tier === currentTier) return;
    
    setSubmitting(tier);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: tier })
        .eq('id', user?.id);

      if (error) throw error;

      setCurrentTier(tier);
      showSuccess(`Plano ${PLAN_LIMITS[tier].name} ativado com sucesso!`);
    } catch (e: any) {
      showError(e.message || "Erro ao processar assinatura.");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  const plans: { id: SubscriptionTier; icon: any; color: string }[] = [
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
          A transcrição de áudio é o seu braço direito no prontuário.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const details = PLAN_LIMITS[plan.id];
          const isCurrent = currentTier === plan.id;
          const Icon = plan.icon;

          return (
            <Card key={plan.id} className={`relative flex flex-col ${isCurrent ? 'border-indigo-600 shadow-indigo-100 shadow-xl' : ''}`}>
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-600">Plano Atual</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className={`mx-auto p-3 rounded-full bg-slate-50 w-fit mb-4 ${plan.color}`}>
                  <Icon className="h-6 w-6" />
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
                    <span><strong>{details.maxSessionsPerMonth === Infinity ? 'Ilimitadas' : details.maxSessionsPerMonth}</strong> sessões/mês</span>
                  </li>
                  
                  {details.maxTranscriptionsPerMonth === 0 ? (
                    <li className="flex items-center gap-3 text-sm text-slate-400">
                      <X className="h-4 w-4 text-red-400 shrink-0" />
                      <span>Sem transcrição de áudio</span>
                    </li>
                  ) : (
                    <li className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>
                        <strong>{details.maxTranscriptionsPerMonth === Infinity ? 'Transcrições Ilimitadas' : `${details.maxTranscriptionsPerMonth} transcrições/mês`}</strong>
                      </span>
                    </li>
                  )}

                  <li className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Insights terapêuticos com IA</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-6">
                <Button 
                  className={`w-full ${isCurrent ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  variant={isCurrent ? "secondary" : "default"}
                  disabled={isCurrent || submitting !== null}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {submitting === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isCurrent ? 'Plano Ativo' : 'Escolher Plano'}
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
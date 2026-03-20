"use client";

import React, { useState, useEffect } from "react";
import { Check, Loader2, Rocket, Zap, Shield, Sparkles, ExternalLink, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_LIMITS, SubscriptionTier } from "@/config/plans";
import { showError } from "@/utils/toast";
import { Link } from "react-router-dom";

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
          const tierFromDb = data.subscription_tier as SubscriptionTier;
          setCurrentTier(PLAN_LIMITS[tierFromDb] ? tierFromDb : 'free');
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

  const currentPlan = PLAN_LIMITS[currentTier];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      <div className="flex items-center gap-4 mb-2">
         <Link to="/configuracoes">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
         </Link>
         <h1 className="text-3xl font-bold text-slate-900">Assinatura</h1>
      </div>

      {hasSubscription && currentTier !== 'free' ? (
        /* VISÃO PARA ASSINANTES: Mostra apenas o plano atual */
        <div className="space-y-6">
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="h-2 bg-indigo-600 w-full" />
            <div className="p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start justify-between">
              <div className="space-y-6 max-w-xl">
                <div>
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-3 py-1 mb-3">Plano Ativo</Badge>
                  <h2 className="text-4xl font-bold text-slate-900">{currentPlan.name}</h2>
                  <p className="text-slate-500 mt-2">{currentPlan.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pacientes</p>
                    <p className="text-xl font-bold text-slate-800">{currentPlan.maxPatients === Infinity ? 'Ilimitados' : currentPlan.maxPatients}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transcrições / mês</p>
                    <p className="text-xl font-bold text-slate-800">{currentPlan.maxTranscriptionsPerMonth === Infinity ? 'Ilimitadas' : currentPlan.maxTranscriptionsPerMonth}</p>
                  </div>
                </div>

                <ul className="space-y-3 pt-2">
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <Check className="h-5 w-5 text-emerald-500" /> Suporte prioritário
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600">
                    <Check className="h-5 w-5 text-emerald-500" /> Exportação de prontuários em PDF
                  </li>
                  {currentPlan.hasTherapeuticInsights && (
                    <li className="flex items-center gap-3 text-sm font-bold text-indigo-700">
                      <Sparkles className="h-5 w-5 text-indigo-500" /> Insights Terapêuticos com IA
                    </li>
                  )}
                </ul>
              </div>

              <Card className="w-full md:w-80 bg-indigo-50/50 border-indigo-100">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-indigo-900">
                    R$ {currentPlan.price.toFixed(2).replace('.', ',')}
                    <span className="text-xs font-normal text-indigo-600/60 ml-1">/mês</span>
                  </div>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Sua assinatura é processada com segurança pelo Stripe. Você pode cancelar ou mudar de plano a qualquer momento.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-md shadow-indigo-200"
                    onClick={() => handleAction(currentTier)}
                    disabled={submitting !== null}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    Gerenciar no Stripe
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
          
          <p className="text-center text-xs text-slate-400">
            Deseja mudar para o plano {currentTier === 'ultra' ? 'Pro' : 'Ultra'}? Use o botão acima para acessar o portal de faturamento.
          </p>
        </div>
      ) : (
        /* VISÃO PARA USUÁRIOS FREE: Vitrine de Planos */
        <div className="space-y-8">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex items-center gap-4">
            <Shield className="h-8 w-8 text-indigo-600" />
            <div>
              <p className="font-bold text-indigo-900">Você está no plano Gratuito</p>
              <p className="text-sm text-indigo-700">Seus limites são reduzidos. Escolha um dos planos abaixo para desbloquear o potencial total da IA.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['basic', 'pro', 'ultra'] as SubscriptionTier[]).map((tierId) => {
              const details = PLAN_LIMITS[tierId];
              const icons = { basic: Zap, pro: Rocket, ultra: Sparkles };
              const colors = { basic: 'text-amber-500', pro: 'text-indigo-600', ultra: 'text-purple-600' };
              const Icon = icons[tierId as keyof typeof icons];

              return (
                <Card key={tierId} className="flex flex-col border-2 hover:border-indigo-200 transition-all">
                  <CardHeader className="text-center">
                    <div className={`mx-auto p-3 rounded-full bg-slate-50 w-fit mb-4 ${colors[tierId as keyof typeof colors]}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold">{details.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">R$ {details.price.toFixed(2).replace('.', ',')}</span>
                      <span className="text-slate-500 text-sm">/mês</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <p className="text-xs text-slate-500 text-center px-4 leading-relaxed">{details.description}</p>
                    <ul className="space-y-3 pt-4 border-t">
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
                  <CardFooter>
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold"
                      onClick={() => handleAction(tierId)}
                      disabled={submitting !== null}
                    >
                      {submitting === tierId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Começar Agora'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente simples de Badge para não depender de imports externos caso não existam
const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
    {children}
  </span>
);

export default Subscription;
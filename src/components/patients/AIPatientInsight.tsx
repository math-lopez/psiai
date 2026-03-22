"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, ClipboardCheck, AlertCircle, FileText, Target, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface AIPatientInsightProps {
  patientId: string;
  hasUltra: boolean;
}

export const AIPatientInsight = ({ patientId, hasUltra }: AIPatientInsightProps) => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<any>(null);

  const generateInsight = async () => {
    if (!hasUltra) {
      showError("O Parecer Consolidado está disponível apenas no plano Ultra.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-patient-history', {
        body: { patientId }
      });

      if (error) throw error;
      setInsight(data);
    } catch (e: any) {
      showError(e.message || "Erro ao gerar parecer.");
    } finally {
      setLoading(false);
    }
  };

  if (!insight && !loading) {
    return (
      <Card className="border-none shadow-xl rounded-[32px] bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden mb-10">
        <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="h-20 w-20 rounded-[28px] bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-black tracking-tight">Parecer Clínico Sugestivo (IA)</h3>
            <p className="text-indigo-100 font-medium max-w-lg">
              Consolide sessões, diários e objetivos em uma análise diagnóstica e terapêutica profunda.
            </p>
          </div>
          <Button 
            onClick={generateInsight}
            disabled={!hasUltra}
            className="md:ml-auto h-14 px-10 rounded-2xl bg-white text-indigo-600 hover:bg-slate-50 font-black shadow-2xl transition-all"
          >
            {hasUltra ? "Gerar Agora" : "Bloqueado (Plano Pro)"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center justify-between px-2">
         <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
           <Brain className="h-4 w-4 text-indigo-500" /> Análise Consolidada PsiAI
         </h3>
         <Button variant="ghost" size="sm" onClick={() => setInsight(null)} className="text-slate-400 font-black text-[10px] uppercase">Fechar Parecer</Button>
      </div>

      {loading ? (
        <Card className="border-none shadow-sm rounded-[32px] p-20 flex flex-col items-center justify-center gap-4">
           <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
           <p className="text-sm font-bold text-slate-500 animate-pulse">Cruzando dados de sessões, diários e evolução...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
             <CardHeader className="bg-slate-50/50 pb-4">
               <CardTitle className="text-xs font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                 <ClipboardCheck className="h-4 w-4" /> Parecer e Sugestão Diagnóstica
               </CardTitle>
             </CardHeader>
             <CardContent className="p-8">
               <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{insight.diagnostic_suggestion || insight.analysis}</p>
             </CardContent>
          </Card>

          <div className="space-y-6">
             <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 pb-4">
                  <CardTitle className="text-xs font-black uppercase text-amber-500 tracking-widest flex items-center gap-2">
                    <Target className="h-4 w-4" /> Recomendação Terapêutica
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <p className="text-sm text-slate-700 leading-relaxed italic">"{insight.therapeutic_recommendation || insight.next_steps}"</p>
                </CardContent>
             </Card>

             <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 pb-4">
                  <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Pontos de Atenção
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <ul className="space-y-2">
                    {(insight.points_of_attention || []).map((p: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2"><div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1 shrink-0" /> {p}</li>
                    ))}
                  </ul>
                </CardContent>
             </Card>
          </div>
        </div>
      )}
    </div>
  );
};
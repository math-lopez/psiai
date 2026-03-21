"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, Calendar, FileText, AlertCircle, CheckCircle2, RefreshCw, ChevronRight, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analysisService } from "@/services/analysisService";
import { PatientAIAnalysis } from "@/types/analysis";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface LongitudinalAnalysisProps {
  patientId: string;
}

export const LongitudinalAnalysis = ({ patientId }: LongitudinalAnalysisProps) => {
  const [analysis, setAnalysis] = useState<PatientAIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchAnalysis = async () => {
    try {
      const data = await analysisService.getLatestAnalysis(patientId);
      setAnalysis(data);
    } catch (e) {
      console.error("Erro ao buscar análise:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [patientId]);

  const handleGenerate = async () => {
    setProcessing(true);
    try {
      await analysisService.requestAnalysis(patientId);
      showSuccess("Solicitação de análise enviada com sucesso!");
      // Poll para verificar conclusão (simplificado aqui para refresh manual ou timeout)
      setTimeout(fetchAnalysis, 3000);
    } catch (e: any) {
      showError(e.message || "Erro ao gerar análise");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-none shadow-sm bg-slate-50/50">
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    );
  }

  const isProcessing = analysis?.status === 'processing' || analysis?.status === 'pending';

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-none shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" /> Parecer com IA
            </CardTitle>
            <CardDescription>Análise longitudinal consolidada de todo o histórico clínico.</CardDescription>
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={processing || isProcessing}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 gap-2"
          >
            {processing || isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : analysis ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isProcessing ? "Analisando..." : analysis ? "Atualizar Análise" : "Gerar Primeiro Parecer"}
          </Button>
        </CardHeader>
        
        <CardContent>
          {!analysis ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <FileText className="h-8 w-8 text-slate-200" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Nenhum parecer gerado</h4>
              <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">
                Clique no botão acima para que a IA analise todas as sessões e gere um resumo clínico estruturado.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    analysis.status === 'completed' ? "bg-emerald-100 text-emerald-600" : 
                    analysis.status === 'error' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {analysis.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : 
                     analysis.status === 'error' ? <AlertCircle className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Status da Análise</p>
                    <p className="text-sm font-bold text-slate-900">
                      {analysis.status === 'completed' ? 'Finalizada com sucesso' : 
                       analysis.status === 'error' ? 'Erro no processamento' : 'Processando dados...'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 px-4 py-2 border-l border-slate-200">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-slate-400">Sessões</p>
                    <p className="text-sm font-bold text-slate-900">{analysis.source_session_count}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-slate-400">Última Versão</p>
                    <p className="text-sm font-bold text-slate-900">
                      {format(new Date(analysis.created_at), "dd/MM/yy")}
                    </p>
                  </div>
                </div>
              </div>

              {analysis.status === 'error' && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 items-start">
                  <TriangleAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-900">Ocorreu um erro ao gerar o parecer</p>
                    <p className="text-xs text-red-700 mt-1">{analysis.processing_error || "Erro desconhecido. Tente novamente."}</p>
                  </div>
                </div>
              )}

              {analysis.status === 'completed' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Síntese Clínica
                      </h4>
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                        {analysis.generated_summary}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    {analysis.generated_risk_flags && analysis.generated_risk_flags.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
                          <TriangleAlert className="h-4 w-4" /> Pontos de Atenção
                        </h4>
                        <div className="space-y-2">
                          {analysis.generated_risk_flags.map((flag, idx) => (
                            <div key={idx} className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                              {flag}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                        <ChevronRight className="h-4 w-4" /> Recomendações
                      </h4>
                      <div className="space-y-2">
                        {analysis.generated_recommendations?.map((rec, idx) => (
                          <div key={idx} className="p-4 bg-indigo-50/50 text-indigo-900 text-xs font-medium rounded-2xl border border-indigo-100 flex gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
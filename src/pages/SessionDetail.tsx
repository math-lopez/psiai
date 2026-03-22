"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ChevronLeft, Edit, Trash2, Mic, Clock, User, FileText, Sparkles, Loader2, AlertTriangle, Music, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Lock, ClipboardList, Zap, Quote, BrainCircuit, ListChecks, TriangleAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { sessionService } from "@/services/sessionService";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@/types";
import { PLAN_LIMITS, SubscriptionTier } from "@/config/plans";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [sessionData, analysisData] = await Promise.all([
        sessionService.getById(id),
        sessionService.getSessionAIAnalysis(id)
      ]);
      
      setSession(sessionData);
      setAiAnalysis(analysisData);
      
      // Se já existe uma análise e ela está pendente/processando, entramos em modo de espera
      if (analysisData && (analysisData.status === 'processing' || analysisData.status === 'pending')) {
        setIsAnalyzing(true);
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user?.id).single();
      setTier(profile?.subscription_tier as SubscriptionTier || "free");
    } catch (e) {
      showError("Erro ao carregar dados da sessão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // CONFIGURAÇÃO DO REALTIME (WebSocket)
    // Escuta mudanças na tabela de análise para esta sessão específica
    const channel = supabase
      .channel(`ai-analysis-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT e UPDATE
          schema: 'public',
          table: 'session_ai_analysis',
          filter: `session_id=eq.${id}`,
        },
        (payload) => {
          console.log("[Realtime] Mudança detectada na análise:", payload);
          const newAnalysis = payload.new as any;
          
          if (newAnalysis.summary) {
            setAiAnalysis(newAnalysis);
            setIsAnalyzing(false);
            if (newAnalysis.status === 'completed') {
              showSuccess("Análise de IA concluída!");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleProcessAudio = async () => {
    setProcessing(true);
    try {
      await sessionService.processAudio(id!);
      showSuccess("Processamento iniciado!");
      fetchData();
    } catch (e: any) {
      showError(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAnalyzeSessionAI = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      // Chamamos a Edge Function, mas não esperamos o resultado pesado dela aqui
      // A função deve retornar "success: true" assim que disparar o processo
      await sessionService.analyzeSessionAI(id!);
      showSuccess("Solicitação de análise enviada!");
    } catch (e: any) {
      // Se der erro de timeout (WORKER_LIMIT), não mostramos erro crítico para o usuário
      // pois o Realtime pode resolver se o processo continuar no background
      if (e.message?.includes('WORKER_LIMIT') || e.message?.includes('504')) {
        console.log("Edge function demorando, aguardando via Realtime...");
      } else {
        setAnalysisError(e.message || "Erro ao processar análise profunda.");
        setIsAnalyzing(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await sessionService.delete(id);
      showSuccess("Sessão excluída com sucesso.");
      navigate("/sessoes");
    } catch (e) {
      showError("Erro ao excluir sessão.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!session) return <div className="p-10 text-center"><Button onClick={() => navigate("/sessoes")}>Voltar</Button></div>;

  const isUltra = PLAN_LIMITS[tier].hasTherapeuticInsights;
  const isProcessing = ['queued', 'processing'].includes(session.processing_status);

  // Verifica se há qualquer conteúdo relevante
  const hasSufficientContent = !!(
    (session.transcript && session.transcript.trim().length > 20) ||
    (session.manual_notes && session.manual_notes.trim().length > 20) ||
    (session.clinical_notes && session.clinical_notes.trim().length > 20) ||
    (session.interventions && session.interventions.trim().length > 20) ||
    (session.session_summary_manual && session.session_summary_manual.trim().length > 20)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sessoes")} className="rounded-2xl h-12 w-12 hover:bg-white border-transparent hover:border-slate-100 shadow-sm"><ChevronLeft className="h-6 w-6" /></Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{session.patient?.full_name}</h1>
            <p className="text-slate-500 font-medium">{format(new Date(session.session_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/sessoes/editar/${id}`}><Button variant="outline" size="sm" className="gap-2 rounded-xl h-10 font-bold border-slate-200"><Edit className="h-4 w-4" /> Editar Atendimento</Button></Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl h-10 font-bold text-red-500 border-slate-200 hover:bg-red-50">
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-2xl font-black">
                  <AlertTriangle className="h-6 w-6 text-red-500" /> Excluir Registro
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 font-medium">
                  Tem certeza que deseja excluir esta sessão de **{session.patient?.full_name}**? Esta ação removerá permanentemente todas as notas clínicas e transcrições vinculadas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-2xl h-12 px-6 font-bold border-slate-100">Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 px-6 font-bold">
                  {deleting ? "Excluindo..." : "Confirmar Exclusão"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
            <div className="h-1.5 w-full bg-slate-100" />
            <CardHeader className="pb-4"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Informações Técnicas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-slate-400" /><p className="text-sm font-bold text-slate-700">Duração: {session.duration_minutes} min</p></div>
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase w-fit",
                session.processing_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                ['queued', 'processing'].includes(session.processing_status) ? 'bg-blue-100 text-blue-700' :
                session.processing_status === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              )}>
                {session.processing_status}
              </div>
            </CardContent>
          </Card>

          {session.audio_file_path && (
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-indigo-50/20">
              <div className="h-1.5 w-full bg-indigo-500" />
              <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400"><Music className="h-4 w-4" /> Áudio da Sessão</CardTitle></CardHeader>
              <CardContent>
                <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-11 font-black shadow-lg shadow-indigo-100" onClick={handleProcessAudio} disabled={processing || isProcessing}>
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {session.processing_status === 'completed' ? "Reprocessar Transcrição" : "Processar Transcrição"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
              <CardHeader className="pb-2 border-b border-slate-50 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-blue-500"><ClipboardList className="h-4 w-4" /> Notas Clínicas</CardTitle></CardHeader>
              <CardContent><p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{session.clinical_notes || "Não preenchido."}</p></CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
              <CardHeader className="pb-2 border-b border-slate-50 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-500"><Zap className="h-4 w-4" /> Intervenções</CardTitle></CardHeader>
              <CardContent><p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{session.interventions || "Não preenchido."}</p></CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
            <CardHeader className="pb-2 border-b border-slate-50 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-500"><Quote className="h-4 w-4" /> Síntese da Sessão</CardTitle></CardHeader>
            <CardContent><p className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap italic">{session.session_summary_manual || "Não preenchido."}</p></CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <CardHeader className="pb-2 border-b border-slate-50 mb-4 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-600">
                <BrainCircuit className="h-4 w-4" /> Análise da Sessão com IA
              </CardTitle>
              {aiAnalysis && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleAnalyzeSessionAI} 
                  disabled={isAnalyzing}
                  className="h-8 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600"
                >
                  {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                  Reprocessar
                </Button>
              )}
            </CardHeader>
            <CardContent className="min-h-[200px] flex flex-col">
              {isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <p className="text-sm font-bold text-slate-500 animate-pulse">A IA está processando sua sessão...</p>
                  <p className="text-[10px] text-slate-400 font-medium">Isso pode levar até 2 minutos. Você pode continuar navegando.</p>
                </div>
              ) : analysisError ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 gap-4">
                  <div className="h-12 w-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900">Erro na análise profunda</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">{analysisError}</p>
                  </div>
                  <Button onClick={handleAnalyzeSessionAI} className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-11 font-black px-6">
                    Tentar novamente
                  </Button>
                </div>
              ) : !aiAnalysis ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 gap-6 border-2 border-dashed border-slate-100 rounded-[28px]">
                  <div className="h-14 w-14 bg-indigo-50 text-indigo-400 rounded-2xl flex items-center justify-center">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-black text-slate-900">Nenhuma análise profunda gerada ainda</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium leading-relaxed">
                      Gere um relatório estruturado com padrões de comportamento, pontos de atenção e recomendações clínicas automáticas.
                    </p>
                  </div>
                  <Button 
                    onClick={handleAnalyzeSessionAI} 
                    disabled={!hasSufficientContent}
                    className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-12 font-black px-8 shadow-xl shadow-indigo-100"
                  >
                    {!hasSufficientContent ? <Lock className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    {hasSufficientContent ? "Gerar análise da sessão" : "Conteúdo insuficiente"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-8 py-2">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Sumário Estruturado
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 italic">
                      {aiAnalysis.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                        <ListChecks className="h-3.5 w-3.5" /> Padrões Identificados
                      </h4>
                      <div className="space-y-2">
                        {aiAnalysis.key_patterns?.map((pattern: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-3 bg-blue-50/30 rounded-xl border border-blue-50 text-xs text-slate-700 font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                            {pattern}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                        <TriangleAlert className="h-3.5 w-3.5" /> Pontos de Atenção
                      </h4>
                      <div className="space-y-2">
                        {aiAnalysis.risk_flags?.length > 0 ? aiAnalysis.risk_flags.map((flag: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-3 bg-red-50/30 rounded-xl border border-red-50 text-xs text-red-700 font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                            {flag}
                          </div>
                        )) : (
                          <p className="text-[10px] text-slate-400 italic">Nenhum risco detectado.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Recomendações Clínicas
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {aiAnalysis.recommendations?.map((rec: string, i: number) => (
                        <div key={i} className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-50 text-xs text-emerald-800 font-medium flex gap-3">
                          <Zap className="h-4 w-4 text-emerald-500 shrink-0" />
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
            <CardHeader className="pb-2 border-b border-slate-50 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-900"><Sparkles className="h-5 w-5 text-indigo-500" /> Transcrição Completa</CardTitle></CardHeader>
            <CardContent><p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{session.transcript || "Não disponível."}</p></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
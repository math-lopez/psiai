"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ChevronLeft, Edit, Trash2, Mic, Clock, FileText, Sparkles, Loader2, AlertTriangle, Music, Lock, Stethoscope, ClipboardList, Zap
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

  const fetchData = async () => {
    if (!id) return;
    try {
      const data = await sessionService.getById(id);
      setSession(data);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user?.id).single();
      setTier(profile?.subscription_tier as SubscriptionTier || "free");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleProcessAudio = async () => {
    setProcessing(true);
    try {
      await sessionService.processAudio(id!);
      showSuccess("Processamento iniciado!");
      fetchData();
    } catch (e: any) { showError(e.message); } finally { setProcessing(false); }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!session) return <div className="p-10 text-center"><Button onClick={() => navigate("/sessoes")}>Voltar</Button></div>;

  const isUltra = PLAN_LIMITS[tier].hasTherapeuticInsights;
  const isProcessing = ['queued', 'processing'].includes(session.processing_status);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sessoes")} className="rounded-xl"><ChevronLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{session.patient?.full_name}</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{format(new Date(session.session_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/sessoes/editar/${id}`}><Button variant="outline" className="h-10 px-6 rounded-xl font-bold gap-2"><Edit className="h-4 w-4" /> Editar Atendimento</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="rounded-[32px] border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-4"><CardTitle className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Atendimento</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 font-bold text-slate-900"><Clock className="h-4 w-4 text-indigo-500" /> {session.duration_minutes} min de sessão</div>
              <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest w-fit shadow-sm", 
                session.processing_status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500')}>
                Status: {session.processing_status}
              </div>
            </CardContent>
          </Card>

          {session.audio_file_path && (
            <Card className="rounded-[32px] border-none shadow-sm bg-indigo-600 text-white overflow-hidden">
              <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"><Zap className="h-4 w-4" /> Inteligência PsiAI</CardTitle></CardHeader>
              <CardContent className="p-6">
                <Button className="w-full h-12 rounded-2xl gap-2 bg-white text-indigo-600 hover:bg-slate-50 font-black shadow-xl" onClick={handleProcessAudio} disabled={processing || isProcessing}>
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {session.processing_status === 'completed' ? "Reprocessar IA" : "Transcrição Inteligente"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Nova Seção: Registro Clínico Estruturado */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <Stethoscope className="h-5 w-5 text-indigo-600" />
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Registro Clínico Estruturado</h3>
            </div>
            
            <Card className="rounded-[32px] border-none shadow-sm overflow-hidden">
              <CardContent className="p-0 divide-y divide-slate-50">
                <div className="p-8 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2"><ClipboardList className="h-3 w-3" /> Resumo do Atendimento</h4>
                  <p className="text-sm text-slate-700 leading-relaxed italic">{session.session_summary_manual || "Não preenchido."}</p>
                </div>
                
                <div className="p-8 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2"><Zap className="h-3 w-3" /> Intervenções Realizadas</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{session.interventions || "Não preenchido."}</p>
                </div>

                <div className="p-8 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2"><FileText className="h-3 w-3" /> Notas de Evolução e Sintomas</h4>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{session.clinical_notes || "Não preenchido."}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[32px] border-none shadow-sm overflow-hidden opacity-80">
            <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100"><CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest"><FileText className="h-4 w-4" /> Rascunho Livre / Notas Manuais</CardTitle></CardHeader>
            <CardContent className="p-8"><p className="text-sm text-slate-600 whitespace-pre-wrap">{session.manual_notes || "Sem notas."}</p></CardContent>
          </Card>

          {session.processing_status === 'completed' && (
            <div className="space-y-6 pt-6">
              <Card className="rounded-[32px] border-none shadow-xl bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
                <CardHeader className="pb-4 border-b border-indigo-100/50"><CardTitle className="flex items-center gap-2 text-indigo-900 text-sm font-black uppercase tracking-widest"><Sparkles className="h-5 w-5 text-indigo-500" /> Transcrição Completa</CardTitle></CardHeader>
                <CardContent className="p-8"><p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">{session.transcript}</p></CardContent>
              </Card>

              {/* Insights do Plano Ultra (se houver) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={cn("rounded-[32px] border-none shadow-sm overflow-hidden", !isUltra && "opacity-60 grayscale")}>
                  <CardHeader><CardTitle className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Highlights da IA</CardTitle></CardHeader>
                  <CardContent className="p-6">
                    {isUltra && session.highlights ? (
                      <ul className="space-y-2">
                        {session.highlights.map((h, i) => <li key={i} className="text-xs text-slate-700 flex gap-2"><div className="h-1 w-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />{h}</li>)}
                      </ul>
                    ) : <div className="flex flex-col items-center py-4 text-center"><Lock className="h-4 w-4 text-slate-300 mb-2" /><p className="text-[10px] font-bold text-slate-400">Upgrade para Ultra</p></div>}
                  </CardContent>
                </Card>
                <Card className={cn("rounded-[32px] border-none shadow-sm overflow-hidden", !isUltra && "opacity-60 grayscale")}>
                  <CardHeader><CardTitle className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Sugestão de Próximos Passos</CardTitle></CardHeader>
                  <CardContent className="p-6">
                    {isUltra ? <p className="text-xs text-slate-700">{session.next_steps}</p> : <div className="flex flex-col items-center py-4 text-center"><Lock className="h-4 w-4 text-slate-300 mb-2" /><p className="text-[10px] font-bold text-slate-400">Upgrade para Ultra</p></div>}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ChevronLeft, Edit, Trash2, Mic, Clock, User, FileText, Sparkles, Loader2, AlertTriangle, Music, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Lock
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

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const data = await sessionService.getById(id);
      setSession(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user?.id).single();
      setTier(profile?.subscription_tier as SubscriptionTier || "free");
    } catch (e) {
      showError("Erro ao carregar sessão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sessoes")}><ChevronLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{session.patient?.full_name}</h1>
            <p className="text-slate-500">{format(new Date(session.session_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/sessoes/editar/${id}`}><Button variant="outline" size="sm" className="gap-2"><Edit className="h-4 w-4" /> Editar</Button></Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" /> Excluir Sessão
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta sessão de **{session.patient?.full_name}**? Esta ação é permanente e removerá todas as notas e transcrições vinculadas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  {deleting ? "Excluindo..." : "Confirmar Exclusão"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-xs uppercase font-bold text-slate-500">Informações</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-slate-400" /><p className="text-sm font-semibold">{session.duration_minutes} min</p></div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase w-fit ${
                session.processing_status === 'completed' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : ['queued', 'processing'].includes(session.processing_status)
                  ? 'bg-blue-100 text-blue-700'
                  : session.processing_status === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {session.processing_status === 'completed' ? 'concluído' : 
                 session.processing_status === 'processing' ? 'processando' :
                 session.processing_status === 'queued' ? 'na fila' : 
                 session.processing_status === 'error' ? 'erro' : 'rascunho'}
              </div>
            </CardContent>
          </Card>

          {session.audio_file_path && (
            <Card className="border-indigo-100 bg-indigo-50/20">
              <CardHeader><CardTitle className="flex items-center gap-2 text-indigo-900 text-sm font-bold uppercase"><Music className="h-4 w-4 text-indigo-500" /> Áudio</CardTitle></CardHeader>
              <CardContent>
                <Button className="w-full gap-2 bg-indigo-600" size="sm" onClick={handleProcessAudio} disabled={processing || isProcessing}>
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {session.processing_status === 'completed' ? "Reprocessar" : "Processar com IA"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b mb-4"><CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 text-slate-400" /> Notas Clínicas</CardTitle></CardHeader>
            <CardContent><p className="text-slate-700 whitespace-pre-wrap">{session.manual_notes || "Sem notas."}</p></CardContent>
          </Card>

          {session.processing_status === 'completed' && (
            <div className="space-y-6">
              <Card className="border-emerald-100 bg-emerald-50/10">
                <CardHeader className="pb-3 border-b border-emerald-100 mb-4"><CardTitle className="flex items-center gap-2 text-emerald-900 text-lg"><Sparkles className="h-5 w-5 text-emerald-500" /> Transcrição</CardTitle></CardHeader>
                <CardContent><p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{session.transcript || "Não disponível."}</p></CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={`relative overflow-hidden ${!isUltra ? 'opacity-70 grayscale' : ''}`}>
                  {!isUltra && (
                    <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                      <Lock className="h-8 w-8 text-indigo-600 mb-2" />
                      <p className="text-xs font-bold text-indigo-900 uppercase">Recurso Ultra</p>
                      <p className="text-[10px] text-slate-600 mt-1">Os insights terapêuticos estão disponíveis apenas no plano Ultra.</p>
                      <Link to="/assinatura"><Button size="sm" variant="link" className="text-indigo-600 text-xs mt-2 underline">Fazer Upgrade</Button></Link>
                    </div>
                  )}
                  <CardHeader><CardTitle className="text-sm font-bold text-indigo-900 uppercase">Pontos Relevantes</CardTitle></CardHeader>
                  <CardContent>
                    {isUltra && session.highlights ? (
                      <ul className="space-y-2">
                        {session.highlights.map((h, i) => <li key={i} className="text-sm text-slate-700 flex gap-2"><span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />{h}</li>)}
                      </ul>
                    ) : <p className="text-sm text-slate-400 italic">Análise bloqueada.</p>}
                  </CardContent>
                </Card>

                <Card className={`relative overflow-hidden ${!isUltra ? 'opacity-70 grayscale' : ''}`}>
                  {!isUltra && (
                    <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                      <Lock className="h-5 w-5 text-indigo-400" />
                    </div>
                  )}
                  <CardHeader><CardTitle className="text-sm font-bold text-amber-900 uppercase">Próximos Passos</CardTitle></CardHeader>
                  <CardContent>
                    {isUltra ? <p className="text-sm text-slate-700">{session.next_steps || "Sem sugestões."}</p> : <p className="text-sm text-slate-400 italic">Análise bloqueada.</p>}
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
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ChevronLeft, 
  Edit, 
  Trash2, 
  Mic, 
  Clock, 
  User, 
  FileText,
  Sparkles,
  Loader2,
  AlertTriangle,
  Music,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { sessionService } from "@/services/sessionService";
import { storageService } from "@/services/storageService";
import { Session } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showError, showSuccess } from "@/utils/toast";

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingAudio, setRemovingAudio] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    if (!id) return;
    try {
      const data = await sessionService.getById(id);
      setSession(data);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessAudio = async () => {
    if (!id) return;
    setProcessing(true);
    try {
      await sessionService.processAudio(id);
      showSuccess("Processamento iniciado com sucesso!");
      fetchSession();
    } catch (e: any) {
      showError(e.message || "Erro ao iniciar processamento.");
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
      showError("Não foi possível excluir a sessão.");
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveAudio = async () => {
    if (!id) return;
    setRemovingAudio(true);
    try {
      await sessionService.removeAudio(id);
      showSuccess("Áudio removido com sucesso.");
      fetchSession();
    } catch (e) {
      showError("Erro ao remover áudio.");
    } finally {
      setRemovingAudio(false);
    }
  };

  const handleDownloadAudio = async () => {
    if (!session?.audio_file_path) return;
    try {
      const url = await storageService.getSignedUrl(session.audio_file_path);
      window.open(url, '_blank');
    } catch (e) {
      showError("Erro ao gerar link para o áudio.");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-10 text-center text-slate-500">
        Sessão não encontrada.
      </div>
    );
  }

  const isProcessing = ['queued', 'processing'].includes(session.processing_status);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sessoes")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sessão: {session.patient?.full_name}</h1>
            <p className="text-slate-500">
              {format(new Date(session.session_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/sessoes/editar/${id}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" /> Editar
            </Button>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" /> Confirmar Exclusão
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro da sessão e quaisquer arquivos de áudio vinculados no storage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  {deleting ? "Excluindo..." : "Sim, Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {session.processing_status === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900">Erro no Processamento de IA</p>
              <p className="text-sm text-red-700">{session.processing_error}</p>
            </div>
            <Button size="sm" variant="outline" className="border-red-200 hover:bg-red-100" onClick={handleProcessAudio} disabled={processing}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold">Resumo da Sessão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Paciente</p>
                  <p className="text-sm font-semibold">{session.patient?.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Duração</p>
                  <p className="text-sm font-semibold">{session.duration_minutes} minutos</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase w-fit ${
                  session.processing_status === 'completed' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : isProcessing
                    ? 'bg-blue-100 text-blue-700'
                    : session.processing_status === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  Status: {session.processing_status === 'completed' ? 'concluído' : 
                          session.processing_status === 'queued' ? 'aguardando IA' : 
                          session.processing_status === 'processing' ? 'processando' : 
                          session.processing_status === 'error' ? 'erro' : 'rascunho'}
                </div>
              </div>
            </CardContent>
          </Card>

          {session.audio_file_path && (
            <Card className="border-indigo-100 bg-indigo-50/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-900 text-sm font-bold uppercase">
                  <Music className="h-4 w-4 text-indigo-500" /> Áudio Anexado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-3 rounded-lg border border-indigo-100">
                  <p className="text-sm font-medium text-slate-900 truncate" title={session.audio_file_name || ''}>
                    {session.audio_file_name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase">Arquivo Privado</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    onClick={handleDownloadAudio}
                  >
                    <ExternalLink className="h-4 w-4" /> Ouvir Áudio
                  </Button>

                  {session.processing_status !== 'completed' && !isProcessing && (
                    <Button 
                      className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                      size="sm"
                      onClick={handleProcessAudio}
                      disabled={processing}
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Processar com IA
                    </Button>
                  )}

                  {session.processing_status === 'completed' && (
                    <Button 
                      variant="ghost"
                      className="w-full gap-2 text-indigo-600 hover:bg-indigo-50"
                      size="sm"
                      onClick={handleProcessAudio}
                      disabled={processing}
                    >
                      <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
                      Reprocessar IA
                    </Button>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                        disabled={removingAudio || isProcessing}
                      >
                        {removingAudio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Remover Áudio
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover arquivo de áudio?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O arquivo será permanentemente excluído do armazenamento e os resultados da IA serão limpos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveAudio} className="bg-red-600 hover:bg-red-700">
                          Sim, Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <FileText className="h-5 w-5 text-slate-400" /> Anotações do Psicólogo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {session.manual_notes || "Nenhuma anotação manual registrada."}
              </p>
            </CardContent>
          </Card>

          {session.processing_status === 'completed' ? (
            <Card className="border-emerald-100 bg-emerald-50/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-900">
                  <Sparkles className="h-5 w-5 text-emerald-500" /> Resultados da IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-emerald-800 uppercase mb-2">Transcrição</h4>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{session.transcript}</p>
                </div>
                {session.highlights && session.highlights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800 uppercase mb-2">Pontos Importantes</h4>
                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                      {session.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {session.next_steps && (
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800 uppercase mb-2">Próximos Passos Sugeridos</h4>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{session.next_steps}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : isProcessing ? (
            <Card className="border-indigo-100 bg-indigo-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" /> 
                  IA está trabalhando...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-indigo-700">
                  O áudio está sendo processado. Isso pode levar alguns minutos dependendo da duração da sessão. 
                  Você pode navegar pelo sistema e voltar mais tarde.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
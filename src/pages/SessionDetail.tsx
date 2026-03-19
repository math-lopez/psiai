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
  AlertCircle,
  CheckCircle2
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
    } catch (e) {
      showError("Erro ao carregar dados da sessão.");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessAudio = async () => {
    if (!id) return;
    setProcessing(true);
    try {
      await sessionService.processAudio(id);
      showSuccess("Processamento solicitado à IA!");
      // Recarrega os dados para mostrar o status 'queued' ou 'processing'
      fetchSession();
    } catch (e: any) {
      showError(e.message || "Erro ao iniciar processamento de áudio.");
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
      showSuccess("Arquivo de áudio removido.");
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
      showError("Erro ao acessar o arquivo de áudio.");
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
      <div className="p-10 text-center">
        <p className="text-slate-500 mb-4">Sessão não encontrada.</p>
        <Button onClick={() => navigate("/sessoes")}>Voltar para a Lista</Button>
      </div>
    );
  }

  const isProcessing = ['queued', 'processing'].includes(session.processing_status);
  const canProcess = session.audio_file_path && !isProcessing;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
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
                  Esta ação excluirá permanentemente o registro da sessão e o áudio armazenado. Não pode ser desfeita.
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

      {/* Alerta de Erro de Processamento */}
      {session.processing_status === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900">Erro no Processamento de IA</p>
              <p className="text-sm text-red-700">{session.processing_error || "Houve um problema ao processar o áudio. Tente novamente."}</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-red-200 hover:bg-red-100 whitespace-nowrap" 
              onClick={handleProcessAudio} 
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Informações e Arquivo */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold">Informações</CardTitle>
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
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase w-fit ${
                  session.processing_status === 'completed' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : isProcessing
                    ? 'bg-blue-100 text-blue-700'
                    : session.processing_status === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
                  {session.processing_status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                  Status: {
                    session.processing_status === 'completed' ? 'concluído' : 
                    session.processing_status === 'queued' ? 'aguardando' : 
                    session.processing_status === 'processing' ? 'processando' : 
                    session.processing_status === 'error' ? 'erro' : 'rascunho'
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {session.audio_file_path && (
            <Card className="border-indigo-100 bg-indigo-50/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-900 text-sm font-bold uppercase">
                  <Music className="h-4 w-4 text-indigo-500" /> Áudio da Sessão
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

                  {canProcess && (
                    <Button 
                      className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                      size="sm"
                      onClick={handleProcessAudio}
                      disabled={processing}
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {session.processing_status === 'completed' ? "Reprocessar IA" : "Processar com IA"}
                    </Button>
                  )}

                  {!isProcessing && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                          disabled={removingAudio}
                        >
                          {removingAudio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Remover Áudio
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover arquivo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Isso apagará o arquivo permanentemente e limpará os resultados gerados pela IA.
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
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Direita: Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notas Manuais */}
          <Card>
            <CardHeader className="pb-3 border-b mb-4">
              <CardTitle className="flex items-center gap-2 text-slate-700 text-lg">
                <FileText className="h-5 w-5 text-slate-400" /> Notas Clínicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {session.manual_notes || "Nenhuma anotação manual registrada para esta sessão."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resultados da IA */}
          {session.processing_status === 'completed' ? (
            <div className="space-y-6">
              <Card className="border-emerald-100 bg-emerald-50/10 shadow-sm">
                <CardHeader className="pb-3 border-b border-emerald-100 mb-4">
                  <CardTitle className="flex items-center gap-2 text-emerald-900 text-lg">
                    <Sparkles className="h-5 w-5 text-emerald-500" /> Transcrição da Sessão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {session.transcript || "Transcrição vazia ou não gerada."}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-indigo-100 bg-white">
                  <CardHeader className="pb-3 border-b border-indigo-50 mb-4">
                    <CardTitle className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Pontos Relevantes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {session.highlights && session.highlights.length > 0 ? (
                      <ul className="space-y-3">
                        {session.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Nenhum destaque identificado.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-amber-100 bg-white">
                  <CardHeader className="pb-3 border-b border-amber-50 mb-4">
                    <CardTitle className="text-sm font-bold text-amber-900 uppercase tracking-wider">Próximos Passos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {session.next_steps || "Nenhuma sugestão de próximos passos gerada."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : isProcessing ? (
            <Card className="border-indigo-100 bg-indigo-50/30 py-12">
              <CardContent className="flex flex-col items-center text-center gap-4">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                <div>
                  <h3 className="text-lg font-bold text-indigo-900">A IA está analisando sua sessão...</h3>
                  <p className="text-sm text-indigo-700 max-w-md mx-auto mt-2">
                    Estamos transcrevendo o áudio e identificando os pontos terapêuticos mais importantes. 
                    Isso pode levar alguns minutos. Você pode sair desta página e voltar mais tarde.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchSession} className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" /> Atualizar Status
                </Button>
              </CardContent>
            </Card>
          ) : session.audio_file_path && session.processing_status === 'draft' ? (
            <Card className="border-dashed border-slate-300 bg-slate-50 py-12">
              <CardContent className="flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <Sparkles className="h-8 w-8 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Pronto para processar</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                    O áudio da sessão foi carregado com sucesso. Clique no botão abaixo para gerar a transcrição e os insights automáticos.
                  </p>
                </div>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 gap-2 px-8" 
                  onClick={handleProcessAudio}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Iniciar Processamento de IA
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
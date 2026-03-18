import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Mic, 
  Clock, 
  User, 
  FileText,
  Sparkles,
  PlayCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sessionService } from "@/services/sessionService";
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

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;
      try {
        const data = await sessionService.getById(id);
        setSession(data);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  const handleStartProcessing = async () => {
    if (!id) return;
    setProcessing(true);
    try {
      await sessionService.processSession(id);
      showSuccess("Processamento iniciado! Os insights estarão prontos em breve.");
      // Atualiza estado local
      if (session) setSession({ ...session, processing_status: 'queued' });
    } catch (error: any) {
      showError("Erro ao iniciar processamento");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const canProcess = session.audio_file_path && 
                     ['draft', 'error'].includes(session.processing_status);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sessão: {session.patient?.full_name}</h1>
            <p className="text-slate-500">
              {format(new Date(session.session_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" /> Editar
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado Esquerdo - Info e Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Status da IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  session.processing_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                  ['queued', 'processing'].includes(session.processing_status) ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {session.processing_status === 'completed' ? 'Concluído' :
                   session.processing_status === 'processing' ? 'Processando' :
                   session.processing_status === 'queued' ? 'Na Fila' : 'Aguardando'}
                </div>
                
                {canProcess && (
                  <Button 
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-700 h-8 gap-2 text-xs"
                    onClick={handleStartProcessing}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlayCircle className="h-3 w-3" />}
                    Processar Áudio
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                A transcrição e os insights são gerados via IA de forma segura e criptografada seguindo a LGPD.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Paciente</p>
                  <p className="text-sm font-medium">{session.patient?.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Duração</p>
                  <p className="text-sm font-medium">{session.duration_minutes} minutos</p>
                </div>
              </div>
              {session.audio_file_name && (
                <div className="flex items-center gap-3">
                  <Mic className="h-4 w-4 text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Arquivo de Áudio</p>
                    <p className="text-sm font-medium truncate max-w-[150px]">{session.audio_file_name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito - Conteúdo */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <FileText className="h-5 w-5 text-slate-400" /> Anotações Manuais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed italic whitespace-pre-wrap">
                {session.manual_notes || "Nenhuma anotação manual registrada."}
              </p>
            </CardContent>
          </Card>

          {session.processing_status === 'completed' ? (
            <>
              <Card className="border-indigo-100 bg-indigo-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Sparkles className="h-5 w-5 text-indigo-500" /> Insights da IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {session.highlights && session.highlights.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-indigo-900 mb-2 uppercase tracking-tight">Destaques da Conversa</h4>
                      <ul className="list-disc list-inside space-y-2 text-slate-700 text-sm">
                        {session.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {session.next_steps && (
                    <div className="pt-4 border-t border-indigo-100">
                      <h4 className="text-sm font-semibold text-indigo-900 mb-2 uppercase tracking-tight">Sugestões de Conduta</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{session.next_steps}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Transcrição Completa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 rounded-lg p-6 text-sm text-slate-600 max-h-[400px] overflow-y-auto leading-loose whitespace-pre-wrap font-mono">
                    {session.transcript || "Transcrição indisponível."}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : ['queued', 'processing'].includes(session.processing_status) ? (
            <Card className="border-dashed border-2 bg-slate-50/50">
              <CardContent className="p-16 text-center space-y-4">
                <div className="relative inline-block">
                  <RefreshCw className="h-10 w-10 text-indigo-300 animate-spin mx-auto" />
                  <Sparkles className="h-5 w-5 text-indigo-500 absolute -top-1 -right-1" />
                </div>
                <h3 className="font-semibold text-slate-900 text-lg">Processamento em Andamento</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Nossa inteligência artificial está ouvindo o áudio, gerando a transcrição e extraindo insights clínicos valiosos. Você receberá uma notificação assim que terminar.
                </p>
              </CardContent>
            </Card>
          ) : session.audio_file_path ? (
            <Card className="border-indigo-100 bg-indigo-50/20">
              <CardContent className="p-12 text-center space-y-4">
                <Mic className="h-10 w-10 text-indigo-400 mx-auto" />
                <h3 className="font-semibold text-slate-800">Áudio pronto para análise</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mb-4">
                  O áudio foi carregado com sucesso. Clique no botão de processamento para gerar insights.
                </p>
                <Button 
                  onClick={handleStartProcessing} 
                  disabled={processing}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {processing ? "Iniciando..." : "Começar Análise com IA"}
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
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Mic, 
  Clock, 
  User, 
  FileText,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockSessions } from "@/lib/mockData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = mockSessions.find(s => s.id === id) || mockSessions[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sessão: {session.patientName}</h1>
            <p className="text-slate-500">
              {format(new Date(session.sessionDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
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
              <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Status do Processamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  session.processingStatus === 'concluido' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {session.processingStatus}
                </div>
                {session.processingStatus === 'concluido' && (
                  <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                    <RefreshCw className="h-3 w-3" /> Re-processar
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                A transcrição e os insights são gerados via IA de forma criptografada.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Paciente</p>
                  <p className="text-sm font-medium">{session.patientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Duração</p>
                  <p className="text-sm font-medium">{session.durationMinutes} minutos</p>
                </div>
              </div>
              {session.audioFileName && (
                <div className="flex items-center gap-3">
                  <Mic className="h-4 w-4 text-indigo-500" />
                  <div>
                    <p className="text-xs text-slate-500">Áudio Anexado</p>
                    <p className="text-sm font-medium truncate max-w-[150px]">{session.audioFileName}</p>
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
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" /> Anotações Manuais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed italic">
                {session.manualNotes || "Nenhuma anotação manual registrada nesta sessão."}
              </p>
            </CardContent>
          </Card>

          {session.processingStatus === 'concluido' ? (
            <>
              <Card className="border-indigo-100 bg-indigo-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Sparkles className="h-5 w-5 text-indigo-500" /> Insights da IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-indigo-900 mb-2">Principais Pontos Extraídos:</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                      {session.highlights?.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-2">Próximos Passos Sugeridos:</h4>
                    <p className="text-sm text-slate-700">{session.nextSteps}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Transcrição Completa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 rounded p-4 text-sm text-slate-600 max-h-[300px] overflow-y-auto">
                    {session.transcript}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="p-12 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-slate-300 animate-spin mx-auto" />
                <h3 className="font-semibold">Sessão sendo processada...</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Estamos transformando o áudio em texto e extraindo insights relevantes. Isso pode levar alguns minutos.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
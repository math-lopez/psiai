import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, Mic, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { sessionService } from "@/services/sessionService";
import { Session } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Sessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await sessionService.list();
        setSessions(data || []);
      } catch (error) {
        console.error("Erro ao buscar sessões:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter(s => {
    const search = searchTerm.toLowerCase();
    const patientName = s.patient?.full_name?.toLowerCase() || "";
    
    // Tenta formatar a data da sessão para comparação se o termo de busca parecer uma data
    let dateStr = "";
    try {
      dateStr = format(new Date(s.session_date), "dd/MM/yyyy");
    } catch (e) {
      dateStr = "";
    }

    return patientName.includes(search) || dateStr.includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Histórico de Sessões</h1>
          <p className="text-slate-500">Acompanhe todos os registros e processamentos.</p>
        </div>
        <Link to="/sessoes/nova">
          <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="h-4 w-4" /> Nova Sessão
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por nome do paciente ou data (dd/mm/aaaa)..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filtros
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Data da Sessão</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <TableRow key={session.id} className="cursor-pointer hover:bg-slate-50">
                    <TableCell className="font-medium">
                      <Link to={`/sessoes/${session.id}`} className="hover:text-indigo-600">
                        {session.patient?.full_name || "Paciente Removido"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {format(new Date(session.session_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {(session.record_type === 'audio' || session.record_type === 'ambos') && (
                          <Mic className="h-4 w-4 text-indigo-500" />
                        )}
                        {(session.record_type === 'manual' || session.record_type === 'ambos') && (
                          <FileText className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase w-fit ${
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
                    </TableCell>
                    <TableCell>{session.duration_minutes} min</TableCell>
                    <TableCell>
                      <Link to={`/sessoes/${session.id}`}>
                        <Button variant="ghost" size="sm" className="text-indigo-600">
                          Ver detalhes
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                    Nenhuma sessão encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Sessions;
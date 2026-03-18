import { Link } from "react-router-dom";
import { Plus, Search, Filter, Mic, FileText } from "lucide-react";
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
import { mockSessions } from "@/lib/mockData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Sessions = () => {
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
          <Input placeholder="Buscar por paciente ou data..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filtros
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
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
            {mockSessions.map((session) => (
              <TableRow key={session.id} className="cursor-pointer hover:bg-slate-50">
                <TableCell className="font-medium">
                  <Link to={`/sessoes/${session.id}`} className="hover:text-indigo-600">
                    {session.patientName}
                  </Link>
                </TableCell>
                <TableCell>
                  {format(new Date(session.sessionDate), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {(session.recordType === 'audio' || session.recordType === 'ambos') && (
                      <Mic className="h-4 w-4 text-indigo-500" />
                    )}
                    {(session.recordType === 'manual' || session.recordType === 'ambos') && (
                      <FileText className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase w-fit ${
                    session.processingStatus === 'concluido' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : session.processingStatus === 'processando'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {session.processingStatus}
                  </div>
                </TableCell>
                <TableCell>{session.durationMinutes} min</TableCell>
                <TableCell>
                  <Link to={`/sessoes/${session.id}`}>
                    <Button variant="ghost" size="sm" className="text-indigo-600">
                      Ver detalhes
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Sessions;
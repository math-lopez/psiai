import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, Mic, FileText, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { sessionService } from "@/services/sessionService";
import { Session, SessionStatus, SessionRecordType } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ITEMS_PER_PAGE = 10;

const Sessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estados para filtros
  const [statusFilters, setStatusFilters] = useState<SessionStatus[]>([]);
  const [typeFilters, setTypeFilters] = useState<SessionRecordType[]>([]);

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

  const toggleStatusFilter = (status: SessionStatus) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleTypeFilter = (type: SessionRecordType) => {
    setTypeFilters(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setStatusFilters([]);
    setTypeFilters([]);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const filteredSessions = sessions.filter(s => {
    const search = searchTerm.toLowerCase();
    const patientName = s.patient?.full_name?.toLowerCase() || "";
    
    let dateStr = "";
    try {
      dateStr = format(new Date(s.session_date), "dd/MM/yyyy");
    } catch (e) {
      dateStr = "";
    }

    const matchesSearch = patientName.includes(search) || dateStr.includes(search);
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(s.processing_status);
    const matchesType = typeFilters.length === 0 || typeFilters.includes(s.record_type);

    return matchesSearch && matchesStatus && matchesType;
  });

  // Paginação
  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilters, typeFilters]);

  const hasActiveFilters = statusFilters.length > 0 || typeFilters.length > 0 || searchTerm !== "";

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

        <Popover>
          <PopoverTrigger asChild>
            <Button variant={statusFilters.length > 0 || typeFilters.length > 0 ? "secondary" : "outline"} className="gap-2">
              <Filter className="h-4 w-4" /> 
              Filtros
              {(statusFilters.length + typeFilters.length) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-indigo-600 text-white rounded-full">
                  {statusFilters.length + typeFilters.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm border-b pb-1">Status</h4>
                <div className="grid gap-2">
                  {[
                    { id: 'draft', label: 'Rascunho' },
                    { id: 'processing', label: 'Processando' },
                    { id: 'completed', label: 'Concluído' },
                    { id: 'error', label: 'Erro' }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`status-${item.id}`} 
                        checked={statusFilters.includes(item.id as SessionStatus)}
                        onCheckedChange={() => toggleStatusFilter(item.id as SessionStatus)}
                      />
                      <Label htmlFor={`status-${item.id}`} className="text-sm cursor-pointer">{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <h4 className="font-semibold text-sm border-b pb-1">Tipo de Registro</h4>
                <div className="grid gap-2">
                  {[
                    { id: 'manual', label: 'Apenas Notas' },
                    { id: 'ambos', label: 'Áudio + Notas' }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`type-${item.id}`} 
                        checked={typeFilters.includes(item.id as SessionRecordType)}
                        onCheckedChange={() => toggleTypeFilter(item.id as SessionRecordType)}
                      />
                      <Label htmlFor={`type-${item.id}`} className="text-sm cursor-pointer">{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {(statusFilters.length > 0 || typeFilters.length > 0) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-indigo-600 text-xs mt-2"
                  onClick={() => {
                    setStatusFilters([]);
                    setTypeFilters([]);
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 gap-1 px-2">
            <X className="h-3 w-3" /> Limpar tudo
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
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
                {paginatedSessions.length > 0 ? (
                  paginatedSessions.map((session) => (
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t bg-slate-50/50">
                <p className="text-sm text-slate-500">
                  Mostrando {paginatedSessions.length} de {filteredSessions.length} sessões
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={currentPage === p ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Próximo <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Sessions;
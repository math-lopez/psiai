import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Filter, MoreHorizontal, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { patientService } from "@/services/patientService";
import { Patient } from "@/types";
import { format } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";

const ITEMS_PER_PAGE = 10;

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await patientService.list();
      setPatients(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar pacientes:", error);
      showError("Não foi possível carregar a lista de pacientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await patientService.delete(deletingId);
      showSuccess("Paciente excluído com sucesso.");
      fetchPatients();
    } catch (error: any) {
      if (error.code === '23503') {
        showError("Não é possível excluir: este paciente possui sessões registradas.");
      } else {
        showError("Erro ao excluir paciente.");
      }
    } finally {
      setDeletingId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const nameMatch = p.full_name?.toLowerCase().includes(search);
    const emailMatch = p.email?.toLowerCase().includes(search);
    const phoneMatch = p.phone?.toLowerCase().includes(search);
    return nameMatch || emailMatch || phoneMatch;
  });

  // Paginação
  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1); // Resetar página ao buscar
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meus Pacientes</h1>
          <p className="text-slate-500">Gerencie sua lista de pacientes e históricos.</p>
        </div>
        <Link to="/pacientes/novo" data-tour="add-patient-btn">
          <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="h-4 w-4" /> Cadastrar Paciente
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border" data-tour="search-patients">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar paciente por nome, e-mail ou telefone..." 
            className="pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPatients.length > 0 ? (
                  paginatedPatients.map((patient) => (
                    <TableRow key={patient.id} className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <TableCell className="font-bold text-slate-900">
                        <Link to={`/pacientes/${patient.id}`} className="hover:text-indigo-600">
                          {patient.full_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-600">{patient.email}</TableCell>
                      <TableCell className="text-slate-600">{patient.phone}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          patient.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {patient.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500">{format(new Date(patient.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-slate-100">
                            <DropdownMenuItem asChild>
                              <Link to={`/pacientes/${patient.id}`} className="font-bold text-xs">Ver detalhes</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/pacientes/editar/${patient.id}`} className="font-bold text-xs">Editar</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600 font-bold text-xs"
                              onClick={() => {
                                setDeletingId(patient.id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-slate-500 font-medium">
                      Nenhum paciente encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/50">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  {filteredPatients.length} paciente(s) no total
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl h-9"
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
                        className="h-9 w-9 p-0 rounded-xl"
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl h-9"
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Excluir paciente?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 font-medium">
              Esta ação não pode ser desfeita. Todos os dados cadastrais serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-2xl h-12 font-bold px-6">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 font-bold px-6">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Patients;
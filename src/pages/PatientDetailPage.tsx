import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Edit, 
  Plus, 
  Calendar, 
  Mail, 
  Phone, 
  CalendarDays, 
  Loader2, 
  Trash2,
  AlertTriangle 
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { patientService } from "@/services/patientService";
import { sessionService } from "@/services/sessionService";
import { Patient, Session } from "@/types";
import { LongitudinalAnalysis } from "@/components/patients/LongitudinalAnalysis";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [pData, sData] = await Promise.all([
          patientService.getById(id),
          sessionService.list()
        ]);
        setPatient(pData);
        setSessions(sData.filter(s => s.patient_id === id));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await patientService.delete(id);
      showSuccess("Paciente removido com sucesso.");
      navigate("/pacientes");
    } catch (e: any) {
      if (e.code === '23503') {
        showError("Não é possível excluir: este paciente possui sessões registradas.");
      } else {
        showError("Erro ao excluir paciente.");
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!patient) return <div className="p-10 text-center">Paciente não encontrado.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")} className="rounded-xl h-12 w-12 hover:bg-white border-transparent hover:border-slate-100">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{patient.full_name}</h1>
            <p className="text-slate-500 font-medium">Prontuário e Histórico Clínico</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/pacientes/editar/${id}`}>
            <Button variant="outline" className="gap-2 rounded-2xl h-11 border-slate-200">
              <Edit className="h-4 w-4" /> Editar Dados
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-2xl h-11 border-slate-200 text-red-500 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" /> Excluir Prontuário
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o paciente **{patient.full_name}**? Esta ação removerá todos os dados cadastrais de forma permanente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-2xl">Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-2xl">
                  {deleting ? "Excluindo..." : "Confirmar Exclusão"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Link to="/sessoes/nova" state={{ patientId: id }}>
            <Button className="bg-primary hover:bg-primary/90 rounded-2xl h-11 shadow-lg shadow-primary/10 gap-2">
              <Plus className="h-4 w-4" /> Registrar Sessão
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <div className="h-1.5 w-full bg-blue-500" />
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dados Cadastrais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-slate-700 truncate">{patient.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-slate-700">{patient.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-slate-700">Nascido em {format(new Date(patient.birth_date), "dd/MM/yyyy")}</span>
              </div>
              <div className="pt-2">
                 <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  patient.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                )}>
                  Status: {patient.status}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl">
            <CardHeader>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                {patient.notes || "Sem observações registradas no prontuário."}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 mb-6 gap-8">
              <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-400 data-[state=active]:text-slate-900 px-1 pb-4 transition-all">
                Histórico de Sessões
              </TabsTrigger>
              <TabsTrigger value="analysis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-400 data-[state=active]:text-slate-900 px-1 pb-4 transition-all flex gap-2">
                Parecer com IA <Badge className="h-5 px-1.5 bg-indigo-50 text-indigo-600 border-indigo-100">Beta</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-6 animate-in fade-in-50 duration-500">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-indigo-500" /> Atendimentos Realizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sessions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sessions.map(s => (
                        <Link key={s.id} to={`/sessoes/${s.id}`} className="group">
                          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:border-slate-100 hover:bg-slate-50 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black group-hover:scale-110 transition-transform">
                                {format(new Date(s.session_date), "dd")}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{format(new Date(s.session_date), "MMMM 'de' yyyy", { locale: ptBR })}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.duration_minutes} min • {s.record_type}</p>
                              </div>
                            </div>
                            <div className={cn(
                              "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                              s.processing_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            )}>
                              {s.processing_status}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <CalendarDays className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-400">Nenhuma sessão registrada para este paciente.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="animate-in fade-in-50 duration-500">
              <LongitudinalAnalysis patientId={id!} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage;
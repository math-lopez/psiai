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
  AlertTriangle,
  Target
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
import { PatientTimeline } from "@/components/patients/PatientTimeline";
import { LatestSessionFeature } from "@/components/patients/LatestSessionFeature";
import { TreatmentPlanModule } from "@/components/treatment/TreatmentPlanModule";
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
        // Filtra sessões deste paciente
        const patientSessions = sData.filter(s => s.patient_id === id);
        setSessions(patientSessions);
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

  const latestSession = sessions.length > 0 
    ? [...sessions].sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())[0] 
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header com Navegação e Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/pacientes")} 
            className="rounded-2xl h-14 w-14 hover:bg-white border-transparent hover:border-slate-100 shadow-sm"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{patient.full_name}</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              Prontuário e Histórico Clínico 
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                patient.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
              )}>
                {patient.status}
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link to={`/pacientes/editar/${id}`}>
            <Button variant="outline" className="gap-2 rounded-2xl h-12 px-6 border-slate-200 font-bold hover:bg-slate-50 transition-all">
              <Edit className="h-4 w-4" /> Editar Dados
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-2xl h-12 px-6 border-slate-200 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold transition-all">
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-2xl font-black">
                  <AlertTriangle className="h-6 w-6 text-red-500" /> Excluir Prontuário
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 font-medium">
                  Tem certeza que deseja excluir o paciente <span className="font-bold text-slate-900">{patient.full_name}</span>? Esta ação removerá todos os dados cadastrais de forma permanente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-2xl h-12 px-6 font-bold border-slate-100">Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 px-6 font-bold">
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Exclusão"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Link to="/sessoes/nova" state={{ patientId: id }}>
            <Button className="bg-primary hover:bg-primary/90 rounded-2xl h-12 px-8 shadow-xl shadow-primary/20 gap-2 font-black transition-all">
              <Plus className="h-5 w-5" /> Registrar Sessão
            </Button>
          </Link>
        </div>
      </div>

      {/* Destaque da Última Sessão */}
      <LatestSessionFeature session={latestSession} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar de Informações */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
            <div className="h-2 w-full bg-blue-500" />
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dados Cadastrais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-black uppercase text-slate-300 tracking-wider">E-mail</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{patient.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 group">
                  <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-slate-300 tracking-wider">Telefone</p>
                    <p className="text-sm font-bold text-slate-700">{patient.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 group">
                  <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-slate-300 tracking-wider">Nascimento</p>
                    <p className="text-sm font-bold text-slate-700">{format(new Date(patient.birth_date), "dd/MM/yyyy")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[32px] bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notas de Prontuário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                  {patient.notes || "Sem observações registradas no prontuário."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal: Overview / Timeline / Treatment Plan */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-slate-100/50 p-1.5 rounded-3xl h-auto mb-10 gap-2 border border-slate-100 flex-wrap justify-start">
              <TabsTrigger 
                value="overview" 
                className="rounded-2xl px-6 py-3 font-black text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all"
              >
                Visão Geral
              </TabsTrigger>
              <TabsTrigger 
                value="treatment" 
                className="rounded-2xl px-6 py-3 font-black text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 transition-all flex gap-2"
              >
                Plano Terapêutico <Target className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger 
                value="analysis" 
                className="rounded-2xl px-6 py-3 font-black text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 transition-all flex gap-2"
              >
                Parecer Clínico <Badge className="h-5 px-1.5 bg-indigo-50 text-indigo-600 border-none text-[8px] font-black">AI BETA</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="animate-in fade-in-50 duration-700 focus-visible:outline-none">
              <PatientTimeline sessions={sessions} />
            </TabsContent>

            <TabsContent value="treatment" className="animate-in fade-in-50 duration-700 focus-visible:outline-none">
              <TreatmentPlanModule patientId={id!} />
            </TabsContent>

            <TabsContent value="analysis" className="animate-in fade-in-50 duration-700 focus-visible:outline-none">
              <LongitudinalAnalysis patientId={id!} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage;
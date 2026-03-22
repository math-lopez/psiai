import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, Edit, Plus, Calendar, Mail, Phone, CalendarDays, Loader2, Trash2, AlertTriangle, ShieldCheck, FileText
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
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { patientService } from "@/services/patientService";
import { sessionService } from "@/services/sessionService";
import { Patient, Session } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showError, showSuccess } from "@/utils/toast";
import { PatientAccessManagement } from "@/components/patients/PatientAccessManagement";

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
      } finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await patientService.delete(id);
      showSuccess("Paciente removido.");
      navigate("/pacientes");
    } catch (e) { showError("Erro ao excluir."); } finally { setDeleting(false); }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!patient) return <div className="p-10 text-center">Não encontrado.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pacientes")}><ChevronLeft className="h-5 w-5" /></Button>
          <h1 className="text-3xl font-black text-slate-900">{patient.full_name}</h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/pacientes/editar/${id}`}><Button variant="outline" size="sm" className="gap-2 rounded-xl"><Edit className="h-4 w-4" /> Editar</Button></Link>
          <Link to="/sessoes/nova"><Button className="bg-indigo-600 rounded-xl gap-2" size="sm"><Plus className="h-4 w-4" /> Nova Sessão</Button></Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white p-1 rounded-2xl border border-slate-100 h-14 w-fit">
          <TabsTrigger value="overview" className="rounded-xl px-6 font-bold gap-2 focus-visible:ring-0 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4" /> Prontuário
          </TabsTrigger>
          <TabsTrigger value="access" className="rounded-xl px-6 font-bold gap-2 focus-visible:ring-0 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <ShieldCheck className="h-4 w-4" /> Portal do Paciente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <Card className="rounded-[32px] border-none shadow-sm">
                <CardHeader><CardTitle className="text-[10px] font-black uppercase text-slate-400">Dados de Contato</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-slate-400" /><span className="text-sm font-bold">{patient.email}</span></div>
                  <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-slate-400" /><span className="text-sm font-bold">{patient.phone}</span></div>
                  <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-slate-400" /><span className="text-sm font-bold">{format(new Date(patient.birth_date), "dd/MM/yyyy")}</span></div>
                </CardContent>
              </Card>
              <Card className="rounded-[32px] border-none shadow-sm">
                <CardHeader><CardTitle className="text-[10px] font-black uppercase text-slate-400">Notas de Evolução</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-slate-600 italic leading-relaxed">{patient.notes || "Sem observações."}</p></CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-[32px] border-none shadow-sm min-h-[400px]">
                <CardHeader><CardTitle className="flex items-center gap-2 font-black"><CalendarDays className="h-5 w-5 text-indigo-500" /> Histórico de Sessões</CardTitle></CardHeader>
                <CardContent>
                  {sessions.length > 0 ? (
                    <div className="space-y-3">
                      {sessions.map(s => (
                        <Link key={s.id} to={`/sessoes/${s.id}`} className="block group">
                          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                            <div>
                              <p className="font-bold">{format(new Date(s.session_date), "dd 'de' MMMM", { locale: ptBR })}</p>
                              <p className="text-xs text-slate-500">{s.duration_minutes} min • {s.record_type}</p>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-white text-[9px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">{s.processing_status}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : <p className="text-center py-20 text-slate-400 italic">Nenhuma sessão registrada.</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="access">
          <PatientAccessManagement patientId={id!} patientEmail={patient.email} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientDetailPage;
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronLeft, Edit, Plus, Calendar, Mail, Phone, CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { patientService } from "@/services/patientService";
import { sessionService } from "@/services/sessionService";
import { Patient, Session } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [pData, sData] = await Promise.all([
          patientService.getById(id),
          sessionService.list() // No futuro, filtrar por patient_id no service
        ]);
        setPatient(pData);
        setSessions(sData.filter(s => s.patient_id === id));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!patient) return <div>Paciente não encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">{patient.full_name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" /> Editar Perfil
          </Button>
          <Link to="/sessoes/nova">
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" size="sm">
              <Plus className="h-4 w-4" /> Registrar Sessão
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase text-slate-500">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{patient.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{patient.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-sm">Nascido em {format(new Date(patient.birth_date), "dd/MM/yyyy")}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase text-slate-500">Notas do Prontuário</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 leading-relaxed">
                {patient.notes || "Sem observações registradas."}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-indigo-500" /> Histórico de Atendimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.map(s => (
                    <Link key={s.id} to={`/sessoes/${s.id}`} className="block">
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-medium">{format(new Date(s.session_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                          <p className="text-xs text-slate-500">{s.duration_minutes} min • {s.record_type}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          s.processing_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {s.processing_status}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-500">Nenhuma sessão registrada para este paciente.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage;
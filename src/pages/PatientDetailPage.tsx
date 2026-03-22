"use client";

import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, Edit, Plus, Calendar, Mail, Phone, Loader2, ShieldCheck, FileText, User, Sparkles, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { patientService } from "@/services/patientService";
import { sessionService } from "@/services/sessionService";
import { Patient, Session } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showError } from "@/utils/toast";
import { PatientAccessManagement } from "@/components/patients/PatientAccessManagement";
import { LatestSessionSummary } from "@/components/patients/LatestSessionSummary";
import { SessionTimeline } from "@/components/patients/SessionTimeline";
import { TreatmentPlanTab } from "@/components/patients/TreatmentPlanTab";

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
          sessionService.list()
        ]);
        setPatient(pData);
        setSessions(sData.filter(s => s.patient_id === id));
      } catch (e) {
        showError("Erro ao carregar dados do paciente.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!patient) return <div className="p-10 text-center">Paciente não encontrado.</div>;

  const latestSession = sessions.length > 0 
    ? [...sessions].sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())[0]
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header com Informações Rápidas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[40px] shadow-sm border border-slate-50">
        <div className="flex items-start gap-6">
          <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-slate-50" onClick={() => navigate("/pacientes")}>
            <ChevronLeft className="h-6 w-6 text-slate-400" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-3xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-100">
                {patient.full_name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{patient.full_name}</h1>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Calendar className="h-3.5 w-3.5" /> {format(new Date(patient.birth_date), "dd/MM/yyyy")}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-slate-200" />
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <User className="h-3.5 w-3.5" /> {patient.gender || "Não informado"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to={`/pacientes/editar/${id}`}>
            <Button variant="outline" className="h-12 px-6 rounded-2xl font-bold border-slate-200 gap-2">
              <Edit className="h-4 w-4" /> Perfil
            </Button>
          </Link>
          <Link to="/sessoes/nova">
            <Button className="h-12 px-6 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 gap-2">
              <Plus className="h-4 w-4" /> Nova Sessão
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-slate-100/50 p-1.5 rounded-[24px] border-none h-auto w-fit overflow-x-auto flex-nowrap">
          <TabsTrigger value="overview" className="rounded-2xl px-8 py-3 font-black text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
            <Sparkles className="h-4 w-4" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="treatment-plan" className="rounded-2xl px-8 py-3 font-black text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
            <Target className="h-4 w-4" /> Plano Terapêutico
          </TabsTrigger>
          <TabsTrigger value="prontuario" className="rounded-2xl px-8 py-3 font-black text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
            <FileText className="h-4 w-4" /> Prontuário
          </TabsTrigger>
          <TabsTrigger value="access" className="rounded-2xl px-8 py-3 font-black text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
            <ShieldCheck className="h-4 w-4" /> Portal do Paciente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-10 outline-none">
          {/* Sessão em Destaque */}
          {latestSession && <LatestSessionSummary session={latestSession} />}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Timeline */}
            <div className="lg:col-span-2">
              <SessionTimeline sessions={sessions} />
            </div>

            {/* Sidebar de Informações Rápidas */}
            <div className="space-y-6">
              <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50">
                  <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contatos Rápidos</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase">E-mail</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{patient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase">WhatsApp</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{patient.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50">
                  <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Observações Fixadas</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-slate-600 italic leading-relaxed">
                    {patient.notes || "Nenhuma observação geral registrada."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="treatment-plan" className="outline-none">
          <TreatmentPlanTab patientId={id!} />
        </TabsContent>

        <TabsContent value="prontuario" className="outline-none">
          <Card className="rounded-[32px] border-none shadow-sm bg-white p-8">
             <div className="flex items-center gap-4 mb-6">
               <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                 <FileText className="h-6 w-6" />
               </div>
               <div>
                 <h3 className="text-xl font-black text-slate-900">Histórico Clínico Completo</h3>
                 <p className="text-sm text-slate-500">Dados consolidados do prontuário para análise profunda.</p>
               </div>
             </div>
             <div className="space-y-6 bg-slate-50 rounded-3xl p-8">
               <p className="text-slate-600 leading-relaxed font-medium">
                 {patient.notes || "Prontuário sem anotações de evolução inicial."}
               </p>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Sessões</p>
                    <p className="text-lg font-black text-indigo-600">{sessions.length}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Tempo Total</p>
                    <p className="text-lg font-black text-indigo-600">{sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0)}m</p>
                  </div>
               </div>
             </div>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="outline-none">
          <PatientAccessManagement patientId={id!} patientEmail={patient.email} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientDetailPage;
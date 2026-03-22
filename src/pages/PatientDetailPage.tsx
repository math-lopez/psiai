"use client";

import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, Edit, Plus, Calendar, Mail, Phone, Loader2, ShieldCheck, FileText, User, Sparkles, Target, Book
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { patientService } from "@/services/patientService";
import { sessionService } from "@/services/sessionService";
import { supabase } from "@/integrations/supabase/client";
import { Patient, Session } from "@/types";
import { SubscriptionTier, PLAN_LIMITS } from "@/config/plans";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showError } from "@/utils/toast";
import { PatientAccessManagement } from "@/components/patients/PatientAccessManagement";
import { LatestSessionSummary } from "@/components/patients/LatestSessionSummary";
import { SessionTimeline } from "@/components/patients/SessionTimeline";
import { TreatmentPlanTab } from "@/components/patients/TreatmentPlanTab";
import { DiaryTab } from "@/components/patients/DiaryTab";
import { ProntuarioTab } from "@/components/patients/ProntuarioTab";
import { AIPatientInsight } from "@/components/patients/AIPatientInsight";

const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user?.id).maybeSingle();
        setTier(profile?.subscription_tier as SubscriptionTier || "free");

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

  const hasUltra = PLAN_LIMITS[tier].hasTherapeuticInsights;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header com Informações Rápidas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-50 dark:border-slate-800">
        <div className="flex items-start gap-6">
          <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => navigate("/pacientes")}>
            <ChevronLeft className="h-6 w-6 text-slate-400" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-3xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-100">
                {patient.full_name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{patient.full_name}</h1>
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
            <Button variant="outline" className="h-12 px-6 rounded-2xl font-bold border-slate-200 dark:border-slate-800 gap-2">
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
        <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-[24px] border-none h-auto w-fit overflow-x-auto flex-nowrap">
          <TabsTrigger value="overview" className="rounded-2xl px-8 py-3 font-black text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
            <Sparkles className="h-4 w-4" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="treatment-plan" className="rounded-2xl px-8 py-3 font-black text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
            <Target className="h-4 w-4" /> Plano Terapêutico
          </TabsTrigger>
          <TabsTrigger value="diary" className="rounded-2xl px-8 py-3 font-black text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
            <Book className="h-4 w-4" /> Diário
          </TabsTrigger>
          <TabsTrigger value="prontuario" className="rounded-2xl px-8 py-3 font-black text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
            <FileText className="h-4 w-4" /> Prontuário
          </TabsTrigger>
          <TabsTrigger value="access" className="rounded-2xl px-8 py-3 font-black text-xs uppercase tracking-widest gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">
            <ShieldCheck className="h-4 w-4" /> Portal do Paciente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-10 outline-none">
          {/* Nova Feature: Parecer Consolidado IA */}
          <AIPatientInsight patientId={id!} hasUltra={hasUltra} />

          {latestSession && <LatestSessionSummary session={latestSession} />}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <SessionTimeline sessions={sessions} />
            </div>
            <div className="space-y-6">
              <Card className="rounded-[32px] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                  <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contatos Rápidos</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase">E-mail</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{patient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase">WhatsApp</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{patient.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                  <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Observações Fixadas</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
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

        <TabsContent value="diary" className="outline-none">
          <DiaryTab patientId={id!} />
        </TabsContent>

        <TabsContent value="prontuario" className="outline-none">
          <ProntuarioTab patient={patient} sessions={sessions} />
        </TabsContent>

        <TabsContent value="access" className="outline-none">
          <PatientAccessManagement patientId={id!} patientEmail={patient.email} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientDetailPage;
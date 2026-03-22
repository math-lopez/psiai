"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Calendar, Clock, CheckCircle2, Plus, ArrowRight, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sessionService } from "@/services/sessionService";
import { patientService } from "@/services/patientService";
import { diaryService } from "@/services/diaryService";
import { DashboardStats, Session, Patient } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ActivityChart } from "@/components/dashboard/ActivityChart";

const StatCard = ({ title, value, icon: Icon, gradient }: any) => (
  <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
    <div className={cn("h-1.5 w-full", gradient)} />
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</CardTitle>
      <div className={cn("p-2 rounded-xl bg-opacity-10", gradient.replace('bg-gradient-to-r', 'text-').replace('from-', '').replace('to-', ''))}>
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verifica se é paciente para redirecionar
        const context = await diaryService.getPatientContext();
        if (context) {
          navigate("/meu-painel", { replace: true });
          return;
        }

        const [s, sess, pats] = await Promise.all([
          sessionService.getStats(),
          sessionService.list(),
          patientService.list()
        ]);
        setStats(s);
        setSessions(sess || []);
        setPatients(pats || []);
      } catch (error) {
        console.error("Erro no Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Visão Geral</h1>
          <p className="text-slate-500 mt-1 font-medium">Sua clínica em números hoje.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/pacientes/novo">
            <Button variant="outline" className="gap-2 rounded-2xl h-12 px-6 border-slate-200 hover:bg-white hover:border-primary hover:text-primary transition-all">
              <Plus className="h-4 w-4" /> Paciente
            </Button>
          </Link>
          <Link to="/sessoes/nova">
            <Button className="bg-primary hover:bg-primary/90 rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 gap-2 transition-all">
              <Sparkles className="h-4 w-4" /> Nova Sessão
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pacientes" value={stats?.totalPatients} icon={Users} gradient="bg-gradient-to-r from-blue-500 to-blue-400" />
        <StatCard title="Sessões" value={stats?.totalSessions} icon={Calendar} gradient="bg-gradient-to-r from-indigo-500 to-indigo-400" />
        <StatCard title="Pendentes" value={stats?.pendingProcessing} icon={Clock} gradient="bg-gradient-to-r from-amber-500 to-amber-400" />
        <StatCard title="Concluídas" value={stats?.completedSessions} icon={CheckCircle2} gradient="bg-gradient-to-r from-emerald-500 to-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" /> Gestão de Atividades
                </CardTitle>
                <CardDescription>Volume de atendimentos por dia</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ActivityChart sessions={sessions} />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-50">
            <CardTitle className="text-xl font-bold text-slate-900">Novos Pacientes</CardTitle>
            <Link to="/pacientes" className="text-sm font-bold text-primary hover:underline flex items-center gap-1 group">
              Ver tudo <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {patients.length > 0 ? patients.slice(0, 3).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center font-black text-blue-600 group-hover:scale-110 transition-transform">
                      {patient.full_name?.charAt(0) || "P"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 leading-none mb-1 truncate">{patient.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{patient.email}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0",
                    patient.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  )}>
                    {patient.status}
                  </div>
                </div>
              )) : (
                <div className="text-center py-10">
                   <Users className="h-10 w-10 text-slate-100 mx-auto mb-2" />
                   <p className="text-xs text-slate-400 font-medium">Nenhum paciente ainda.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-50">
          <CardTitle className="text-xl font-bold text-slate-900">Sessões Recentes</CardTitle>
          <Link to="/sessoes" className="text-sm font-bold text-primary hover:underline flex items-center gap-1 group">
            Ver todas <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.length > 0 ? sessions.slice(0, 4).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:border-slate-100 hover:bg-slate-50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 group-hover:scale-110 transition-transform">
                    {session.patient?.full_name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none mb-1">{session.patient?.full_name}</p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase">
                      {format(new Date(session.session_date), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                  session.processing_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                )}>
                  {session.processing_status}
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-10">
                 <Calendar className="h-10 w-10 text-slate-100 mx-auto mb-2" />
                 <p className="text-xs text-slate-400 font-medium">Nenhuma sessão registrada.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Calendar, Clock, CheckCircle2, Plus, ArrowRight, Loader2, Sparkles, TrendingUp, ChevronRight } from "lucide-react";
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

const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }: any) => (
  <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 group bg-white dark:bg-slate-900">
    <CardContent className="p-0">
      <div className="flex items-stretch h-32">
        <div className={cn("w-2", bgClass)} />
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</span>
            <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110 duration-300", bgClass, colorClass)}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</div>
        </div>
      </div>
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
    <div className="space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Painel de Controle</h1>
          <p className="text-slate-500 mt-1 font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500" /> {format(new Date(), "eeee, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link to="/pacientes/novo">
            <Button variant="outline" className="gap-2 rounded-[20px] h-14 px-8 border-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 font-bold transition-all shadow-sm">
              <Plus className="h-4 w-4" /> Novo Paciente
            </Button>
          </Link>
          <Link to="/sessoes/nova">
            <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-[20px] h-14 px-8 shadow-xl shadow-indigo-600/20 gap-2 font-black transition-all">
              <Sparkles className="h-4 w-4" /> Registrar Sessão
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Pacientes" value={stats?.totalPatients} icon={Users} bgClass="bg-blue-600" colorClass="text-white" />
        <StatCard title="Atendimentos" value={stats?.totalSessions} icon={Calendar} bgClass="bg-indigo-600" colorClass="text-white" />
        <StatCard title="Em Análise" value={stats?.pendingProcessing} icon={Clock} bgClass="bg-amber-500" colorClass="text-white" />
        <StatCard title="Finalizadas" value={stats?.completedSessions} icon={CheckCircle2} bgClass="bg-emerald-500" colorClass="text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[32px] overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="p-8 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                  </div>
                  Atividade da Clínica
                </CardTitle>
                <CardDescription className="font-medium text-slate-400 mt-1">Sessões realizadas nos últimos 7 dias</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <ActivityChart sessions={sessions} />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-6 border-b border-slate-50 dark:border-slate-800">
            <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Novos Pacientes</CardTitle>
            <Link to="/pacientes" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors flex items-center gap-2 group">
              Todos <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {patients.length > 0 ? patients.slice(0, 4).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 rounded-3xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-[18px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-slate-600 dark:text-slate-400 group-hover:from-indigo-500 group-hover:to-indigo-600 group-hover:text-white transition-all duration-500">
                      {patient.full_name?.charAt(0) || "P"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white leading-tight mb-1 truncate">{patient.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate">{patient.email}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              )) : (
                <div className="text-center py-10">
                   <Users className="h-12 w-12 text-slate-100 dark:text-slate-800 mx-auto mb-3" />
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Nenhum paciente cadastrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between p-8 pb-6 border-b border-slate-50 dark:border-slate-800">
          <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Sessões Recentes</CardTitle>
          <Link to="/sessoes" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors flex items-center gap-2 group">
            Histórico Completo <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.length > 0 ? sessions.slice(0, 3).map((session) => (
              <div key={session.id} className="p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-all group bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center font-black text-indigo-600 group-hover:scale-110 transition-all duration-500">
                      {session.patient?.full_name?.charAt(0) || "P"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white leading-tight mb-1">{session.patient?.full_name}</p>
                      <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">
                        {format(new Date(session.session_date), "dd 'de' MMM", { locale: ptBR })} • {format(new Date(session.session_date), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Clock className="h-3 w-3 text-slate-400" />
                     <span className="text-[11px] font-bold text-slate-500 uppercase">{session.duration_minutes} min</span>
                   </div>
                   <div className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                    session.processing_status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  )}>
                    {session.processing_status}
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-10">
                 <Calendar className="h-12 w-12 text-slate-100 dark:text-slate-800 mx-auto mb-3" />
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Nenhuma sessão encontrada</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
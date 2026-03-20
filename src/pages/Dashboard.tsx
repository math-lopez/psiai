"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Calendar, Clock, CheckCircle2, Plus, ArrowRight, Loader2, Sparkles, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sessionService } from "@/services/sessionService";
import { patientService } from "@/services/patientService";
import { DashboardStats, Session, Patient } from "@/types";
import { format, subDays, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, sess, pats] = await Promise.all([
          sessionService.getStats(),
          sessionService.list(),
          patientService.list()
        ]);
        setStats(s);
        setSessions(sess || []);
        setPatients(pats || []);

        // Processar dados para o gráfico (últimos 7 dias)
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const date = subDays(new Date(), 6 - i);
          const count = (sess || []).filter(session => 
            isSameDay(new Date(session.session_date), date)
          ).length;
          
          return {
            name: format(date, "EEE", { locale: ptBR }),
            sessoes: count,
            date: format(date, "dd/MM")
          };
        });
        setChartData(last7Days);

      } catch (error) {
        console.error("Erro no Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
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
        {/* Gráfico de Gestão de Atividades */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Gestão de Atividades</CardTitle>
              <CardDescription>Volume de sessões nos últimos 7 dias</CardDescription>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSessao" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 600}}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    cursor={{stroke: '#6366F1', strokeWidth: 2}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sessoes" 
                    stroke="#6366F1" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorSessao)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Sessões Recentes encurtada para caber ao lado */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-50">
            <CardTitle className="text-xl font-bold text-slate-900">Sessões</CardTitle>
            <Link to="/sessoes" className="text-primary hover:underline">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {sessions.length > 0 ? sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 shrink-0">
                    {session.patient?.full_name?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm truncate">{session.patient?.full_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{format(new Date(session.session_date), "dd/MM HH:mm")}</p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-xs text-slate-400 py-10">Sem sessões recentes.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lista de Novos Pacientes mantida mas com design polido */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-50">
            <CardTitle className="text-xl font-bold text-slate-900">Novos Pacientes</CardTitle>
            <Link to="/pacientes" className="text-sm font-bold text-primary hover:underline flex items-center gap-1 group">
              Ver tudo <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {patients.length > 0 ? patients.slice(0, 4).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center font-black text-blue-600 group-hover:scale-110 transition-transform">
                      {patient.full_name?.charAt(0) || "P"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-none mb-1">{patient.full_name}</p>
                      <p className="text-[11px] text-slate-400 font-bold uppercase">Entrou em {format(new Date(patient.created_at), "MMMM 'de' yyyy", { locale: ptBR })}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
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

        {/* Card informativo de Dica ou Status da Clínica */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-indigo-600 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Sparkles className="h-24 w-24" />
          </div>
          <CardHeader>
            <CardTitle className="text-white/60 text-xs font-black uppercase tracking-widest">Dica da PsiAI</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-6 relative z-10">
            <h3 className="text-2xl font-bold leading-tight">Mantenha seus prontuários atualizados para melhores insights.</h3>
            <p className="text-white/80 text-sm">Nossa IA analisa padrões em suas notas clínicas e transcrições para sugerir caminhos terapêuticos mais precisos.</p>
            <Button variant="secondary" className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-2xl h-12">
              Explorar Recursos Pro
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
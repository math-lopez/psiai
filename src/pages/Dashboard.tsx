import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Calendar, Clock, CheckCircle2, Plus, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sessionService } from "@/services/sessionService";
import { patientService } from "@/services/patientService";
import { DashboardStats, Session, Patient } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

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
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
          <p className="text-slate-500">Acompanhe o desempenho da sua clínica hoje.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/pacientes/novo">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Novo Paciente
            </Button>
          </Link>
          <Link to="/sessoes/nova">
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="h-4 w-4" /> Nova Sessão
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total de Pacientes" value={stats?.totalPatients} icon={Users} color="bg-blue-500" />
        <StatCard title="Total de Sessões" value={stats?.totalSessions} icon={Calendar} color="bg-indigo-500" />
        <StatCard title="Aguardando Processamento" value={stats?.pendingProcessing} icon={Clock} color="bg-amber-500" />
        <StatCard title="Sessões Concluídas" value={stats?.completedSessions} icon={CheckCircle2} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Sessões Recentes</CardTitle>
            <Link to="/sessoes" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.length > 0 ? sessions.slice(0, 4).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                      {session.patient?.full_name?.charAt(0) || "P"}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{session.patient?.full_name}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(session.session_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    session.processing_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {session.processing_status}
                  </div>
                </div>
              )) : (
                <p className="text-center py-4 text-slate-500">Nenhuma sessão registrada.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Pacientes Recentes</CardTitle>
            <Link to="/pacientes" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patients.length > 0 ? patients.slice(0, 4).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600">
                      {patient.full_name?.charAt(0) || "P"}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{patient.full_name}</p>
                      <p className="text-xs text-slate-500">Entrou em {format(new Date(patient.created_at), "MMMM 'de' yyyy", { locale: ptBR })}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    patient.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {patient.status}
                  </div>
                </div>
              )) : (
                <p className="text-center py-4 text-slate-500">Nenhum paciente cadastrado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
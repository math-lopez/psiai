"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Sparkles, 
  ClipboardCheck, 
  BookOpen, 
  Clock, 
  ArrowRight, 
  Loader2,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";

const PortalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [sharedLogs, setSharedLogs] = useState<any[]>([]);
  const [patientInfo, setPatientInfo] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Buscar vínculo do paciente
        const { data: access } = await supabase
          .from('patient_access')
          .select('*, patients(*)')
          .eq('user_id', user.id)
          .single();

        if (access) {
          setPatientInfo(access.patients);
          
          // 2. Buscar Prompts Ativos
          const { data: p } = await supabase
            .from('patient_log_prompts')
            .select('*')
            .eq('patient_id', access.patient_id)
            .eq('status', 'active');
          setPrompts(p || []);

          // 3. Buscar Registros Compartilhados
          const { data: l } = await supabase
            .from('patient_logs')
            .select('*')
            .eq('patient_id', access.patient_id)
            .eq('visibility', 'shared_with_patient')
            .order('created_at', { ascending: false })
            .limit(3);
          setSharedLogs(l || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Olá, {patientInfo?.full_name?.split(' ')[0]}!</h1>
        <p className="text-slate-500 font-medium italic">Seu espaço seguro para registros e acompanhamento terapêutico.</p>
      </div>

      {/* Tarefas / Prompts */}
      <section className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" /> Atividades Propostas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prompts.length > 0 ? prompts.map((p) => (
            <Card key={p.id} className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white hover:shadow-md transition-all">
              <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-widest">Aguardando</span>
                    {p.due_date && <span className="text-[10px] text-slate-400 font-bold">Até {format(new Date(p.due_date), "dd/MM")}</span>}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 leading-tight">{p.title}</h4>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{p.description}</p>
                </div>
                <Button 
                  onClick={() => navigate("/portal/diario")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-11 font-black gap-2 mt-2"
                >
                  Responder <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
               <CheckCircle2 className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
               <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Tudo em dia por aqui!</p>
            </div>
          )}
        </div>
      </section>

      {/* Conteúdos Compartilhados */}
      <section className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-2">
          <index className="h-4 w-4" /> Compartilhado com Você
        </h3>
        <div className="space-y-4">
          {sharedLogs.length > 0 ? sharedLogs.map((log) => (
            <Link key={log.id} to={`/portal/diario`} className="block group">
              <div className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm group-hover:shadow-md group-hover:border-indigo-100 transition-all flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-none mb-2">{log.title || "Registro Compartilhado"}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> {format(new Date(log.created_at), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          )) : (
            <div className="p-12 text-center">
              <p className="text-sm text-slate-400 italic">O psicólogo ainda não compartilhou materiais específicos com você.</p>
            </div>
          )}
        </div>
      </section>

      <div className="bg-indigo-600 rounded-[40px] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl" />
        <div className="relative z-10 max-w-xl">
           <h3 className="text-xl font-black mb-2 flex items-center gap-2"><Clock className="h-5 w-5" /> Entre Sessões</h3>
           <p className="text-sm text-indigo-100 leading-relaxed font-medium">
             Este é um espaço para você registrar seus pensamentos e sentimentos no momento em que eles acontecem. 
             Seu psicólogo terá acesso a esses registros para enriquecer os próximos encontros.
           </p>
           <Link to="/portal/diario">
            <Button className="mt-6 bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl px-8 font-black">
              Ir para o Diário
            </Button>
           </Link>
        </div>
      </div>
    </div>
  );
};

export default PortalDashboard;
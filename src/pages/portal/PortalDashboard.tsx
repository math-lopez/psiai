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
  CheckCircle2,
  Heart
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
        const { data: access } = await supabase
          .from('patient_access')
          .select('*, patients(*)')
          .eq('user_id', user.id)
          .single();

        if (access) {
          setPatientInfo(access.patients);
          
          const { data: p } = await supabase
            .from('patient_log_prompts')
            .select('*')
            .eq('patient_id', access.patient_id)
            .eq('status', 'active');
          setPrompts(p || []);

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

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );

  const firstName = patientInfo?.full_name?.split(' ')[0];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-4">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Olá, {firstName}! <Heart className="inline-block h-10 w-10 text-pink-500 ml-2 animate-pulse" />
        </h1>
        <p className="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
          Este é o seu porto seguro. Aqui você pode registrar como se sente e acompanhar sua evolução terapêutica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          {/* Tarefas / Prompts */}
          <section className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-4 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Atividades Propostas
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {prompts.length > 0 ? prompts.map((p) => (
                <Card key={p.id} className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white hover:shadow-xl transition-all group">
                  <CardContent className="p-8 flex items-center justify-between gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Aguardando</span>
                        {p.due_date && <span className="text-[10px] text-slate-400 font-bold">Até {format(new Date(p.due_date), "dd/MM")}</span>}
                      </div>
                      <h4 className="text-xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{p.title}</h4>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-1">{p.description}</p>
                    </div>
                    <Button 
                      onClick={() => navigate("/portal/diario")}
                      className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-8 font-black gap-2 shadow-lg shadow-indigo-100 shrink-0"
                    >
                      Responder <ArrowRight className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              )) : (
                <div className="py-16 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                   <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
                   <p className="text-sm text-slate-400 font-black uppercase tracking-widest">Tudo em dia!</p>
                </div>
              )}
            </div>
          </section>

          {/* Conteúdos Compartilhados */}
          <section className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Materiais Compartilhados
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {sharedLogs.length > 0 ? sharedLogs.map((log) => (
                <Link key={log.id} to={`/portal/diario`} className="block group">
                  <div className="p-8 bg-white border border-slate-100 rounded-[40px] shadow-sm group-hover:shadow-xl group-hover:border-indigo-100 transition-all duration-300 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <BookOpen className="h-7 w-7" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg leading-none mb-2">{log.title || "Registro Compartilhado"}</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" /> {format(new Date(log.created_at), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="p-12 text-center opacity-50">
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400 italic">O psicólogo ainda não compartilhou materiais específicos.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-indigo-600 rounded-[48px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
            <div className="absolute top-0 right-0 h-48 w-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
            <div className="relative z-10 space-y-6">
               <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Clock className="h-7 w-7" />
               </div>
               <div>
                 <h3 className="text-2xl font-black mb-3 leading-tight">Momentos entre Sessões</h3>
                 <p className="text-indigo-100 leading-relaxed font-medium">
                   Não espere a próxima sessão para falar. Registre seus sentimentos agora e compartilhe com seu psicólogo.
                 </p>
               </div>
               <Link to="/portal/diario" className="block">
                <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl h-14 font-black text-lg transition-transform hover:scale-105 active:scale-95">
                  Abrir Meu Diário
                </Button>
               </Link>
            </div>
          </div>

          <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Dica do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                "A autoconsciência é o primeiro passo para a mudança profunda. O ato de escrever ajuda o cérebro a processar emoções complexas."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PortalDashboard;
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
  Files,
  Upload,
  Cloud,
  ChevronDown,
  UserCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AttachmentModule } from "@/components/attachments/AttachmentModule";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";

const PortalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allAccess, setAllAccess] = useState<any[]>([]);
  const [selectedAccess, setSelectedAccess] = useState<any>(null);
  
  const [prompts, setPrompts] = useState<any[]>([]);
  const [sharedLogs, setSharedLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchVenculos = async () => {
      if (!user) return;
      try {
        // 1. Buscar todos os vínculos ativos do paciente e o nome do psicólogo (via profiles)
        const { data: accessList, error } = await supabase
          .from('patient_access')
          .select(`
            *,
            patients!inner(*),
            psychologist:profiles!patient_access_psychologist_id_fkey(full_name, crp)
          `)
          .eq('user_id', user.id)
          .eq('patients.status', 'ativo')
          .order('updated_at', { ascending: false });

        if (error) throw error;

        setAllAccess(accessList || []);
        
        // Recupera o psicólogo selecionado anteriormente ou pega o primeiro
        const savedId = localStorage.getItem('psiai_selected_patient_id');
        const initial = accessList?.find(a => a.patient_id === savedId) || accessList?.[0];
        
        if (initial) {
          handleSelectProfessional(initial);
        }
      } catch (err) {
        console.error("[Portal] Erro ao carregar vínculos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVenculos();
  }, [user]);

  const handleSelectProfessional = async (access: any) => {
    setSelectedAccess(access);
    localStorage.setItem('psiai_selected_patient_id', access.patient_id);
    
    // 2. Buscar Prompts Ativos do psicólogo selecionado
    const { data: p } = await supabase
      .from('patient_log_prompts')
      .select('*')
      .eq('patient_id', access.patient_id)
      .eq('status', 'active');
    setPrompts(p || []);

    // 3. Buscar Registros Compartilhados pelo psicólogo selecionado
    const { data: l } = await supabase
      .from('patient_logs')
      .select('*')
      .eq('patient_id', access.patient_id)
      .eq('visibility', 'shared_with_patient')
      .order('created_at', { ascending: false })
      .limit(3);
    setSharedLogs(l || []);
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Olá, {selectedAccess?.patients?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-500 font-medium italic">Seu espaço seguro para acompanhamento terapêutico.</p>
        </div>

        {allAccess.length > 1 && (
          <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
             <span className="text-[9px] font-black uppercase text-slate-400 pl-2">Psicólogo Atual:</span>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 font-bold gap-2">
                    <UserCircle className="h-4 w-4" />
                    {selectedAccess?.psychologist?.full_name}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-2xl border-slate-100 p-2">
                  <div className="px-3 py-2 text-[10px] font-black uppercase text-slate-400">Escolha o Profissional</div>
                  {allAccess.map((access) => (
                    <DropdownMenuItem 
                      key={access.patient_id}
                      onClick={() => handleSelectProfessional(access)}
                      className={cn(
                        "rounded-xl py-3 cursor-pointer",
                        selectedAccess?.patient_id === access.patient_id ? "bg-indigo-50 text-indigo-700 font-bold" : "font-medium"
                      )}
                    >
                      <div className="flex flex-col">
                        <span>{access.psychologist?.full_name}</span>
                        <span className="text-[10px] opacity-60">CRP: {access.psychologist?.crp}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        )}
      </div>

      {selectedAccess ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
               <CardHeader className="pb-4">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Files className="h-4 w-4" /> Documentos com {selectedAccess.psychologist?.full_name}
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <AttachmentModule 
                    key={selectedAccess.patient_id}
                    patientId={selectedAccess.patient_id} 
                    psychologistId={selectedAccess.psychologist_id} 
                    role="patient" 
                  />
               </CardContent>
            </Card>

            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 px-2 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" /> Atividades Pendentes
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {prompts.length > 0 ? prompts.slice(0, 2).map((p) => (
                    <Card key={p.id} className="border-none shadow-sm rounded-[24px] bg-amber-50/50 border border-amber-100">
                      <CardContent className="p-5 space-y-3">
                        <p className="text-sm font-bold text-slate-900 leading-tight">{p.title}</p>
                        <Button 
                          onClick={() => navigate("/portal/diario")}
                          className="w-full bg-amber-500 hover:bg-amber-600 rounded-xl h-9 text-xs font-black"
                        >
                          Responder
                        </Button>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="p-8 text-center bg-slate-50 rounded-[24px] border border-dashed border-slate-200">
                       <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tudo em dia!</p>
                    </div>
                  )}
                </div>
              </section>

              <Card className="border-none shadow-sm rounded-[32px] bg-indigo-600 text-white overflow-hidden">
                 <CardContent className="p-6 space-y-4">
                    <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                      <Cloud className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Segurança de Dados</h4>
                      <p className="text-[10px] text-indigo-100 leading-relaxed mt-1">
                        Cada profissional tem acesso exclusivo ao seu próprio prontuário. Seus dados nunca são compartilhados entre psicólogos diferentes.
                      </p>
                    </div>
                 </CardContent>
              </Card>
            </div>
          </div>

          <section className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Diário Compartilhado
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
                <div className="p-12 text-center bg-white rounded-[32px] border border-dashed border-slate-100">
                  <p className="text-xs text-slate-400 italic">Nenhum registro compartilhado por este profissional recentemente.</p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <Card className="p-20 text-center rounded-[40px] border-none shadow-sm bg-white">
          <Cloud className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Sua conta está ativa, mas não encontramos prontuários ativos no momento.</p>
        </Card>
      )}
    </div>
  );
};

import { cn } from "@/lib/utils";

export default PortalDashboard;
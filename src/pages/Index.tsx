"use client";

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      if (authLoading) return;

      const token = searchParams.get("token");

      // SE NÃO ESTÁ LOGADO
      if (!session) {
        if (token) {
          navigate(`/portal/ativar?token=${token}`, { replace: true });
          return;
        }
        navigate("/login", { replace: true });
        return;
      }

      try {
        // SE ESTÁ LOGADO, VERIFICA PAPEL
        const { data: profile } = await supabase
          .from('profiles')
          .select('crp')
          .eq('id', session.user.id)
          .maybeSingle();

        // Se é Psicólogo, vai pro Dashboard
        if (profile && profile.crp) {
          navigate("/dashboard", { replace: true });
          return;
        }

        // Tenta auto-vínculo pelo e-mail se for um paciente que acabou de confirmar conta
        const { data: patientData } = await supabase
          .from('patients')
          .select('id, patient_access(id, user_id)')
          .eq('email', session.user.email)
          .maybeSingle();
        
        if (patientData) {
          const access = Array.isArray(patientData.patient_access) 
            ? patientData.patient_access[0] 
            : patientData.patient_access;
          
          if (access && !access.user_id) {
             await supabase
              .from('patient_access')
              .update({ user_id: session.user.id, status: 'active', invite_token: null })
              .eq('id', access.id);
          }
        }

        // Verifica se tem acesso ativo para ir pro portal
        const { data: accessList } = await supabase
          .from('patient_access')
          .select('id, patients(status)')
          .eq('user_id', session.user.id);

        const hasActive = accessList?.some(a => (a.patients as any)?.status === 'ativo');

        if (hasActive) {
          navigate("/portal", { replace: true });
          return;
        }

        // Caso sem papel (psicólogo sem CRP preenchido)
        if (profile && !profile.crp) {
          navigate("/configuracoes");
          return;
        }

        await supabase.auth.signOut();
        navigate("/login?error=no-access", { replace: true });
        
      } catch (err) {
        console.error("[Index] Erro:", err);
        navigate("/login", { replace: true });
      }
    };

    checkRoleAndRedirect();
  }, [session, authLoading, navigate, searchParams]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center">
        Garantindo acesso seguro...
      </p>
    </div>
  );
};

export default Index;
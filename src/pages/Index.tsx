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

      // 1. SE NÃO ESTÁ LOGADO
      if (!session) {
        if (token) {
          navigate(`/portal/ativar?token=${token}`, { replace: true });
          return;
        }
        navigate("/login", { replace: true });
        return;
      }

      try {
        // 2. TENTAR AUTO-VÍNCULO PELO E-MAIL (Crucial para o fluxo de confirmação de e-mail)
        // Buscamos um prontuário que tenha este e-mail mas ainda não tenha um user_id vinculado
        const { data: patientData } = await supabase
          .from('patients')
          .select('id, email, patient_access(id, user_id, status)')
          .eq('email', session.user.email)
          .maybeSingle();

        if (patientData) {
          const access = Array.isArray(patientData.patient_access) 
            ? patientData.patient_access[0] 
            : patientData.patient_access;

          // Se achamos o prontuário mas ele não tem o seu ID de usuário ainda, vinculamos AGORA.
          if (access && !access.user_id) {
            await supabase
              .from('patient_access')
              .update({ 
                user_id: session.user.id, 
                status: 'active', 
                invite_token: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', access.id);
          }
        }

        // 3. VERIFICAR PAPEL PARA REDIRECIONAMENTO
        
        // É Psicólogo?
        const { data: profile } = await supabase
          .from('profiles')
          .select('crp')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile && profile.crp) {
          navigate("/dashboard", { replace: true });
          return;
        }

        // É Paciente com acesso ativo?
        const { data: accessList } = await supabase
          .from('patient_access')
          .select('id, patients(status)')
          .eq('user_id', session.user.id);

        const hasActive = accessList?.some(a => (a.patients as any)?.status === 'ativo');

        if (hasActive) {
          navigate("/portal", { replace: true });
          return;
        }

        // Se é psicólogo mas falta CRP
        if (profile && !profile.crp) {
          navigate("/configuracoes", { replace: true });
          return;
        }

        // Se nada funcionou, desloga para evitar loop
        await supabase.auth.signOut();
        navigate("/login?error=no-access", { replace: true });
        
      } catch (err) {
        console.error("[Index] Erro crítico de redirecionamento:", err);
        navigate("/login", { replace: true });
      }
    };

    checkRoleAndRedirect();
  }, [session, authLoading, navigate, searchParams]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="relative">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 bg-indigo-600 rounded-full animate-ping" />
        </div>
      </div>
      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center animate-pulse">
        Finalizando sua configuração de acesso...
      </p>
    </div>
  );
};

export default Index;
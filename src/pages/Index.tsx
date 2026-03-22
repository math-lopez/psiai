"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      if (authLoading) return;

      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        console.log("[Index] Verificando identidade do usuário:", session.user.id);
        
        // 1. Verifica se é um Paciente Ativo
        const { data: patientAccess } = await supabase
          .from('patient_access')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (patientAccess) {
          console.log("[Index] Identificado como Paciente. Indo para /portal");
          navigate("/portal", { replace: true });
          return;
        }

        // 2. Verifica se é um Psicólogo (tem CRP no perfil)
        const { data: profile } = await supabase
          .from('profiles')
          .select('crp')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile && profile.crp) {
          console.log("[Index] Identificado como Psicólogo. Indo para /dashboard");
          navigate("/dashboard", { replace: true });
          return;
        }

        // 3. Usuário sem papel (Órfão)
        console.warn("[Index] Usuário sem permissões detectado.");
        await supabase.auth.signOut();
        // Redireciona com parâmetro de erro para o login mostrar a toast de aviso
        navigate("/login?error=no-access", { replace: true });

      } catch (err) {
        console.error("[Index] Erro crítico:", err);
        navigate("/login", { replace: true });
      }
    };

    checkRoleAndRedirect();
  }, [session, authLoading, navigate]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center px-4">
        Validando permissões de acesso...
      </p>
    </div>
  );
};

export default Index;
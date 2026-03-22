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
      // Espera o AuthContext carregar a sessão
      if (authLoading) return;

      if (!session) {
        console.log("[Index] Sem sessão ativa. Indo para /login");
        navigate("/login", { replace: true });
        return;
      }

      try {
        console.log("[Index] Checando banco para:", session.user.id);
        
        // Verifica se o usuário logado é um paciente
        const { data: patientAccess, error } = await supabase
          .from('patient_access')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (patientAccess) {
          console.log("[Index] Paciente detectado. Redirecionando para /portal");
          navigate("/portal", { replace: true });
        } else {
          console.log("[Index] Psicólogo detectado. Redirecionando para /dashboard");
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("[Index] Erro crítico no redirecionamento:", err);
        // Em caso de erro, por segurança, deslogamos ou voltamos ao login
        navigate("/login", { replace: true });
      }
    };

    checkRoleAndRedirect();
  }, [session, authLoading, navigate]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
        Autenticando acesso seguro...
      </p>
    </div>
  );
};

export default Index;
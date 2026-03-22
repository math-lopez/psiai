"use client";

import { useEffect, useState } from "react";
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
        navigate("/login", { replace: true });
        return;
      }

      try {
        // Verifica explicitamente se o usuário logado é um paciente
        const { data: patientAccess } = await supabase
          .from('patient_access')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (patientAccess) {
          console.log("[Index] Usuário identificado como Paciente. Redirecionando para /portal");
          navigate("/portal", { replace: true });
        } else {
          console.log("[Index] Usuário identificado como Psicólogo. Redirecionando para /dashboard");
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("[Index] Erro no redirecionamento:", err);
        navigate("/login", { replace: true });
      }
    };

    checkRoleAndRedirect();
  }, [session, authLoading, navigate]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
        Organizando seu consultório digital...
      </p>
    </div>
  );
};

export default Index;
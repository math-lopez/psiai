"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { resolveUserRole } from "@/App";

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

        const role = await resolveUserRole(session.user.id);

        if (role === "patient") {
          const { data: accessData } = await supabase
            .from('patient_access')
            .select('id, patients(status)')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!accessData) {
            throw new Error("Patient access record not found during redirect.");
          }

          const patientStatus = (accessData.patients as any)?.status;

          if (patientStatus === 'inativo') {
            console.log("[Index] Paciente inativo detectado.");
            await supabase.auth.signOut();
            navigate("/login?error=inactive", { replace: true });
            return;
          }

          console.log("[Index] Identificado como Paciente Ativo. Indo para /portal");
          navigate("/portal", { replace: true });
          return;
        }

        if (role === "psychologist") {
          console.log("[Index] Identificado como Psicólogo. Indo para /dashboard");
          navigate("/dashboard", { replace: true });
          return;
        }

        console.warn("[Index] Usuário sem permissões detectado.");
        await supabase.auth.signOut();
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

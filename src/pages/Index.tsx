"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      if (authLoading) return;

      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        // Verifica se o usuário logado existe na tabela de acesso de pacientes
        const { data: patientAccess, error } = await supabase
          .from('patient_access')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (patientAccess) {
          // É um paciente, manda para o portal
          navigate("/portal", { replace: true });
        } else {
          // Não é paciente (ou é psicólogo), manda para o dashboard clínico
          // Nota: No futuro podemos verificar explicitamente a tabela de perfis também
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Erro ao redirecionar usuário:", err);
        navigate("/login", { replace: true });
      } finally {
        setChecking(false);
      }
    };

    checkRoleAndRedirect();
  }, [session, authLoading, navigate]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
        Preparando seu espaço seguro...
      </p>
    </div>
  );
};

export default Index;
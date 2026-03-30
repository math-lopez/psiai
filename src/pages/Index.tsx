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
          // Se tem token, força ir para a ativação
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

        // Se é Psicólogo, ignora qualquer token e vai pro Dashboard
        if (profile && profile.crp) {
          navigate("/dashboard", { replace: true });
          return;
        }

        // Se é Paciente, processa vínculo se houver token
        if (token) {
          await supabase
            .from('patient_access')
            .update({
              user_id: session.user.id,
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('invite_token', token)
            .eq('status', 'invited');
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

        // Caso sem acesso
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
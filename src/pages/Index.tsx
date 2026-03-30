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
        console.log("[Index] Identificando usuário:", session.user.id);
        
        // 1. Busca todos os vínculos, priorizando o mais recente e que esteja 'ativo'
        const { data: accessList } = await supabase
          .from('patient_access')
          .select('id, patient_id, patients(status)')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false });

        let accessData = accessList?.find(a => (a.patients as any)?.status === 'ativo') || accessList?.[0];

        // 2. Se NÃO tem vínculo, verifica se tem um Token de Convite no metadado
        if (!accessData) {
          const inviteToken = session.user.user_metadata?.pending_invite_token;
          
          if (inviteToken) {
            const { data: updatedAccess, error: linkError } = await supabase
              .from('patient_access')
              .update({
                user_id: session.user.id,
                status: 'active',
                invite_token: null,
                updated_at: new Date().toISOString()
              })
              .eq('invite_token', inviteToken)
              .select('id, patient_id, patients(status)')
              .maybeSingle();

            if (!linkError && updatedAccess) {
              accessData = updatedAccess;
              await supabase.auth.updateUser({ data: { pending_invite_token: null } });
            }
          }
        }

        // 3. Redirecionamento
        if (accessData) {
          const patientStatus = (accessData.patients as any)?.status;
          if (patientStatus === 'inativo' && accessList && accessList.length === 1) {
            await supabase.auth.signOut();
            navigate("/login?error=inactive", { replace: true });
            return;
          }
          navigate("/portal", { replace: true });
          return;
        }

        // 4. Psicólogo
        const { data: profile } = await supabase
          .from('profiles')
          .select('crp')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile && profile.crp) {
          navigate("/dashboard", { replace: true });
          return;
        }

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
      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center">
        Garantindo acesso seguro...
      </p>
    </div>
  );
};

export default Index;
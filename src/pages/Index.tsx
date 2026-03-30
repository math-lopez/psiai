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

      if (!session) {
        // Se houver token mas não houver sessão, vai para a tela de ativação
        const token = searchParams.get("token");
        if (token) {
          navigate(`/portal/ativar?token=${token}`, { replace: true });
          return;
        }
        navigate("/login", { replace: true });
        return;
      }

      try {
        // 1. BUSCA PERFIL DE PSICÓLOGO PRIMEIRO
        // Se for psicólogo, ignoramos tokens de convite (evita o erro de consumir o próprio convite ao testar)
        const { data: profile } = await supabase
          .from('profiles')
          .select('crp')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile && profile.crp) {
          navigate("/dashboard", { replace: true });
          return;
        }

        // 2. VERIFICAÇÃO DE VÍNCULO PENDENTE (Para usuários que não são psicólogos)
        const inviteToken = searchParams.get("token") || session.user.user_metadata?.pending_invite_token;
        
        if (inviteToken) {
          console.log("[Index] Processando vínculo pendente...");
          const { error: linkError } = await supabase
            .from('patient_access')
            .update({
              user_id: session.user.id,
              status: 'active',
              invite_token: null, 
              updated_at: new Date().toISOString()
            })
            .eq('invite_token', inviteToken)
            .eq('status', 'invited'); // Garante que só ativa se estiver pendente

          if (!linkError) {
             await supabase.auth.updateUser({ data: { pending_invite_token: null } });
          }
        }
        
        // 3. BUSCA VÍNCULOS DO PACIENTE
        const { data: accessList } = await supabase
          .from('patient_access')
          .select('id, patient_id, patients(status)')
          .eq('user_id', session.user.id);

        const activeAccess = accessList?.find(a => (a.patients as any)?.status === 'ativo');

        if (activeAccess) {
          navigate("/portal", { replace: true });
          return;
        }

        // Se tem vínculos mas todos inativos
        if (accessList && accessList.length > 0) {
            await supabase.auth.signOut();
            navigate("/login?error=inactive", { replace: true });
            return;
        }

        // Caso não tenha perfil nem vínculo
        await supabase.auth.signOut();
        navigate("/login?error=no-access", { replace: true });
        
      } catch (err) {
        console.error("[Index] Erro crítico:", err);
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
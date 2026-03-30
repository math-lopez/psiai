"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ShieldCheck, BrainCircuit, AlertCircle, Mail } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [patientEmail, setPatientEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorType, setErrorType] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setErrorType("missing_token");
        setLoading(false);
        return;
      }

      try {
        console.log("Validando token:", token);
        
        // Busca o convite. Se retornar vazio, é provável que o RLS esteja bloqueando 
        // ou o token esteja realmente errado/expirado.
        const { data: access, error: accessError } = await supabase
          .from('patient_access')
          .select('id, patient_id, status')
          .eq('invite_token', token)
          .eq('status', 'invited')
          .maybeSingle();

        if (accessError) {
          console.error("Erro Supabase:", accessError);
          setErrorType("database_error");
          setLoading(false);
          return;
        }

        if (!access) {
          console.warn("Nenhum convite encontrado para o token fornecido.");
          setErrorType("invalid_token");
          setLoading(false);
          return;
        }

        // Tenta buscar o e-mail (pode falhar por RLS se o usuário não for o dono)
        const { data: patient } = await supabase
          .from('patients')
          .select('email')
          .eq('id', access.patient_id)
          .maybeSingle();

        setInviteData(access);
        if (patient?.email) {
          setPatientEmail(patient.email);
        }
      } catch (err) {
        console.error("Erro crítico na validação:", err);
        setErrorType("system_error");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientEmail) {
      showError("Por favor, informe seu e-mail cadastrado.");
      return;
    }

    if (password.length < 6) {
      showError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      showError("As senhas não coincidem.");
      return;
    }

    setValidating(true);
    try {
      // 1. Criar o usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: patientEmail,
        password: password,
        options: {
          data: { role: 'patient' }
        }
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          throw new Error("Este e-mail já possui uma conta ativa. Tente fazer login.");
        }
        throw authError;
      }

      if (authData.user) {
        // 2. Vincular o novo user_id ao registro de acesso
        const { error: updateError } = await supabase
          .from('patient_access')
          .update({
            user_id: authData.user.id,
            status: 'active',
            invite_token: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', inviteData.id);

        if (updateError) throw updateError;

        showSuccess("Conta ativada! Você já pode acessar seu portal.");
        navigate("/login");
      } else {
        showSuccess("Verifique seu e-mail para confirmar a ativação.");
        navigate("/login");
      }
    } catch (err: any) {
      showError(err.message || "Erro ao ativar conta.");
    } finally {
      setValidating(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Validando seu acesso...</p>
    </div>
  );

  if (!inviteData) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full text-center p-8 rounded-[40px] border-none shadow-2xl">
          <div className="mx-auto h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-black mb-2">Convite Inválido</CardTitle>
          <CardDescription className="text-slate-500 font-medium mb-8 leading-relaxed">
            {errorType === "invalid_token" 
              ? "Este link de convite expirou, já foi utilizado ou é inválido." 
              : "Não foi possível validar seu convite no momento. Verifique sua conexão ou fale com seu psicólogo."}
          </CardDescription>
          <Button onClick={() => navigate("/login")} className="w-full bg-slate-900 hover:bg-slate-800 rounded-2xl h-14 font-black">
            Voltar para Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-indigo-600">
      <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
        <div className="h-2 w-full bg-indigo-400" />
        <CardHeader className="text-center pt-10">
          <div className="flex justify-center mb-4">
            <BrainCircuit className="h-12 w-12 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Ativar Meu Acesso</CardTitle>
          <CardDescription className="font-medium px-4">
            Crie sua senha para acessar o portal terapêutico.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleActivate} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Mail className="h-3 w-3" /> Seu E-mail cadastrado
              </Label>
              <Input 
                type="email"
                placeholder="Ex: joao@email.com"
                required
                className="rounded-2xl h-12 border-slate-200 font-bold"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                disabled={!!patientEmail && patientEmail.includes("@")}
              />
              {!patientEmail && (
                <p className="text-[9px] text-amber-600 font-bold leading-tight">
                  * Por segurança, digite o e-mail que você informou ao seu psicólogo.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pass" className="text-[10px] font-black uppercase text-slate-400">Escolha uma Senha</Label>
              <Input 
                id="pass" 
                type="password" 
                required 
                placeholder="Mínimo 6 caracteres"
                className="rounded-2xl h-12 border-slate-200 font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-[10px] font-black uppercase text-slate-400">Confirme a Senha</Label>
              <Input 
                id="confirm" 
                type="password" 
                required 
                placeholder="Repita a senha"
                className="rounded-2xl h-12 border-slate-200 font-bold"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black mt-4 shadow-lg shadow-indigo-100 text-lg transition-all active:scale-95"
              disabled={validating}
            >
              {validating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Ativando...
                </div>
              ) : (
                "Criar Minha Conta"
              )}
            </Button>
          </form>
        </CardContent>
        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck className="h-3 w-3 text-emerald-500" /> Prontuário protegido por criptografia
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ActivateAccount;
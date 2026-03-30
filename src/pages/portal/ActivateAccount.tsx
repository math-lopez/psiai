"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, BrainCircuit, AlertCircle, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [patientEmail, setPatientEmail] = useState("");
  const [isEmailLocked, setIsEmailLocked] = useState(false); // NOVO: Controle de bloqueio
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [alreadyHasAccount, setAlreadyHasAccount] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // 1. Busca o convite pelo token
        const { data: access, error } = await supabase
          .from('patient_access')
          .select('id, patient_id, status, user_id')
          .eq('invite_token', token)
          .maybeSingle();

        if (error || !access) {
          setLoading(false);
          return;
        }

        if (access.user_id) {
          setAlreadyHasAccount(true);
        }

        setInviteData(access);

        // 2. Tenta buscar o e-mail
        const { data: patient } = await supabase
          .from('patients')
          .select('email')
          .eq('id', access.patient_id)
          .maybeSingle();

        if (patient?.email) {
          setPatientEmail(patient.email);
          setIsEmailLocked(true); // SÓ BLOQUEIA se veio do banco
        }
        
      } catch (err) {
        console.error("[Activate] Erro na validação:", err);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientEmail) {
      showError("Por favor, informe seu e-mail.");
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: patientEmail,
        password: password,
        options: {
          data: { role: 'patient' }
        }
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("already registered")) {
          setAlreadyHasAccount(true);
          setValidating(false);
          return;
        }
        throw authError;
      }

      if (authData?.user) {
        await supabase
          .from('patient_access')
          .update({
            user_id: authData.user.id,
            status: 'active',
            invite_token: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', inviteData.id);
      }

      showSuccess("Conta ativada! Verifique seu e-mail para confirmar.");
      navigate("/login");
      
    } catch (err: any) {
      showError(err.message || "Erro ao ativar conta.");
      setValidating(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aguarde...</p>
    </div>
  );

  if (!inviteData && !alreadyHasAccount) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full text-center p-8 rounded-[40px] border-none shadow-2xl">
          <div className="mx-auto h-20 w-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-black mb-2">Convite não encontrado</CardTitle>
          <CardDescription className="text-slate-500 font-medium mb-8">
            O link pode ter expirado ou já foi utilizado.
          </CardDescription>
          <Button onClick={() => navigate("/login")} className="w-full bg-slate-900 rounded-2xl h-14 font-black">
            Ir para o Login
          </Button>
        </Card>
      </div>
    );
  }

  if (alreadyHasAccount) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-indigo-600">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
          <div className="h-2 w-full bg-amber-400" />
          <CardHeader className="text-center pt-10">
            <CheckCircle2 className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-black">Você já possui acesso!</CardTitle>
            <CardDescription className="font-medium px-4">
              O e-mail <strong>{patientEmail}</strong> já está cadastrado.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Button 
              onClick={() => navigate(`/login?email=${patientEmail}${token ? `&token=${token}` : ''}`)} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black text-lg flex gap-2"
            >
              Entrar na Minha Conta <ArrowRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-indigo-600">
      <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
        <div className="h-2 w-full bg-indigo-400" />
        <CardHeader className="text-center pt-10">
          <BrainCircuit className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <CardTitle className="text-2xl font-black tracking-tight">Ativar Meu Acesso</CardTitle>
          <CardDescription className="font-medium px-4">
            Defina uma senha para acessar seu prontuário online.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleActivate} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Seu E-mail</Label>
              <Input 
                type="email"
                placeholder="Informe seu e-mail cadastrado"
                value={patientEmail} 
                onChange={(e) => setPatientEmail(e.target.value)}
                readOnly={isEmailLocked} // AGORA USA O ESTADO CORRETO
                className={cn(
                  "rounded-2xl h-12 font-bold",
                  isEmailLocked ? "bg-slate-50 border-slate-100" : "bg-white border-slate-200"
                )}
              />
              {!isEmailLocked && (
                <p className="text-[9px] text-amber-600 font-bold uppercase mt-1 px-1">
                  * Digite o mesmo e-mail onde recebeu o convite.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Crie uma Senha</Label>
              <Input type="password" required placeholder="Mínimo 6 caracteres" className="rounded-2xl h-12 border-slate-200" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Confirme a Senha</Label>
              <Input type="password" required placeholder="Repita a senha" className="rounded-2xl h-12 border-slate-200" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 h-14 rounded-2xl font-black mt-4 text-lg" disabled={validating}>
              {validating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar Minha Conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivateAccount;
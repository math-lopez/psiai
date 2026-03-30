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
  const [alreadyHasAccount, setAlreadyHasAccount] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        console.log("[Activate] Validando token:", token);
        
        // Busca simples: apenas o registro de acesso pelo token
        const { data: access, error } = await supabase
          .from('patient_access')
          .select('id, patient_id, status, user_id')
          .eq('invite_token', token)
          .maybeSingle();

        if (error || !access) {
          console.error("[Activate] Token não encontrado no banco.");
          setLoading(false);
          return;
        }

        // Se o vínculo já está ativo e tem um usuário, a conta já existe
        if (access.status === 'active' || access.user_id) {
          console.log("[Activate] Vínculo já está ativo.");
          setAlreadyHasAccount(true);
        }

        // Busca o e-mail do paciente para facilitar o cadastro
        const { data: patient } = await supabase
          .from('patients')
          .select('email, full_name')
          .eq('id', access.patient_id)
          .maybeSingle();

        setInviteData(access);
        if (patient) setPatientEmail(patient.email);
        
      } catch (err) {
        console.error("[Activate] Erro crítico na validação:", err);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // 1. Tenta criar o usuário no Auth
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

      // 2. Vincula o novo usuário ao prontuário
      if (authData?.user) {
        const { error: updateError } = await supabase
          .from('patient_access')
          .update({
            user_id: authData.user.id,
            status: 'active',
            invite_token: null, // Só limpa aqui após o sucesso
            updated_at: new Date().toISOString()
          })
          .eq('id', inviteData.id);
        
        if (updateError) throw updateError;
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
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Validando acesso...</p>
    </div>
  );

  // Se o token não existe ou foi invalidado
  if (!inviteData && !alreadyHasAccount) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full text-center p-8 rounded-[40px] border-none shadow-2xl">
          <div className="mx-auto h-20 w-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-black mb-2">Convite não encontrado</CardTitle>
          <CardDescription className="text-slate-500 font-medium mb-8">
            O link pode ter expirado ou já foi utilizado para criar sua conta.
          </CardDescription>
          <Button onClick={() => navigate("/login")} className="w-full bg-slate-900 rounded-2xl h-14 font-black">
            Ir para o Login
          </Button>
        </Card>
      </div>
    );
  }

  // Se detectamos que o paciente já tem conta
  if (alreadyHasAccount) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-indigo-600">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
          <div className="h-2 w-full bg-amber-400" />
          <CardHeader className="text-center pt-10">
            <CheckCircle2 className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-black">Sua conta já está pronta!</CardTitle>
            <CardDescription className="font-medium px-4">
              O e-mail <strong>{patientEmail}</strong> já está cadastrado. 
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Button 
              onClick={() => navigate(`/login?email=${patientEmail}&token=${token}`)} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black text-lg flex gap-2"
            >
              Fazer Login e Acessar <ArrowRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fluxo normal de cadastro
  return (
    <div className="h-screen flex items-center justify-center p-4 bg-indigo-600">
      <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
        <div className="h-2 w-full bg-indigo-400" />
        <CardHeader className="text-center pt-10">
          <BrainCircuit className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <CardTitle className="text-2xl font-black tracking-tight">Ativar Meu Acesso</CardTitle>
          <CardDescription className="font-medium">
            Defina uma senha para acessar seu prontuário online.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleActivate} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Seu E-mail</Label>
              <Input value={patientEmail} readOnly className="rounded-2xl h-12 bg-slate-50 font-bold" />
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
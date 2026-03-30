"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ShieldCheck, BrainCircuit, AlertCircle, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
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
        // Busca o acesso e os dados básicos do paciente/psicólogo
        const { data: access, error: accessError } = await supabase
          .from('patient_access')
          .select('*, patients(email, full_name), psychologist:profiles(full_name)')
          .eq('invite_token', token)
          .maybeSingle();

        if (accessError || !access) {
          console.error("Token não encontrado ou erro:", accessError);
          setLoading(false);
          return;
        }

        // Se já estiver ativo, avisa que já possui conta
        if (access.status === 'active') {
          setAlreadyHasAccount(true);
          setPatientEmail(access.patients?.email || "");
          setInviteData(access);
          setLoading(false);
          return;
        }

        setInviteData(access);
        setPatientEmail(access.patients?.email || "");
        
      } catch (err) {
        console.error("Erro na validação:", err);
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: patientEmail,
        password: password,
        options: {
          data: { 
            role: 'patient',
            pending_invite_token: token 
          }
        }
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("already registered") || authError.status === 422) {
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
          .eq('invite_token', token);
      }

      showSuccess("Senha cadastrada! Confirme seu e-mail para entrar.");
      navigate("/login");
      
    } catch (err: any) {
      showError(err.message || "Erro ao ativar conta.");
      setValidating(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verificando convite...</p>
    </div>
  );

  if (!inviteData && !alreadyHasAccount) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full text-center p-8 rounded-[40px] border-none shadow-2xl">
          <div className="mx-auto h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-black mb-2">Convite Inválido</CardTitle>
          <CardDescription className="text-slate-500 font-medium mb-8 leading-relaxed">
            Este link expirou, já foi utilizado ou é inválido. Peça um novo convite ao seu psicólogo.
          </CardDescription>
          <Button onClick={() => navigate("/login")} className="w-full bg-slate-900 hover:bg-slate-800 rounded-2xl h-14 font-black">
            Voltar para Login
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
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-amber-500" />
            </div>
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Vínculo Identificado</CardTitle>
            <CardDescription className="font-medium px-4">
              O e-mail <strong>{patientEmail}</strong> já possui uma conta ativa no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Para acessar este prontuário, basta fazer login com sua conta existente. O sistema vinculará o novo profissional automaticamente.
              </p>
            </div>
            <Button 
              onClick={() => navigate(`/login?email=${patientEmail}${token ? `&token=${token}` : ''}`)} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black shadow-lg shadow-indigo-100 text-lg flex gap-2"
            >
              Fazer Login Agora <ArrowRight className="h-5 w-5" />
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
          <div className="flex justify-center mb-4">
            <BrainCircuit className="h-12 w-12 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Ativar Meu Acesso</CardTitle>
          <CardDescription className="font-medium px-4">
            Olá! Você foi convidado por <strong>{inviteData.psychologist?.full_name || 'seu psicólogo'}</strong> para acompanhar seu tratamento online.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleActivate} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Mail className="h-3 w-3" /> Seu E-mail de Acesso
              </Label>
              <Input 
                type="email"
                required
                className="rounded-2xl h-12 border-slate-200 font-bold bg-slate-50"
                value={patientEmail}
                readOnly
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pass" className="text-[10px] font-black uppercase text-slate-400">Crie uma Senha</Label>
              <Input id="pass" type="password" required placeholder="Mínimo 6 caracteres" className="rounded-2xl h-12 border-slate-200 font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-[10px] font-black uppercase text-slate-400">Confirme a Senha</Label>
              <Input id="confirm" type="password" required placeholder="Repita a senha" className="rounded-2xl h-12 border-slate-200 font-bold" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black mt-4 shadow-lg shadow-indigo-100 text-lg transition-all" disabled={validating}>
              {validating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar Minha Conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivateAccount;
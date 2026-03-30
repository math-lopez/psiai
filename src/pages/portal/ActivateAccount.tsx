"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ShieldCheck, BrainCircuit, AlertCircle } from "lucide-react";
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

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Buscamos primeiro o registro de acesso pelo token
        const { data: access, error: accessError } = await supabase
          .from('patient_access')
          .select('id, patient_id, status')
          .eq('invite_token', token)
          .eq('status', 'invited')
          .maybeSingle();

        if (accessError || !access) {
          console.error("Token inválido ou erro na busca:", accessError);
          setLoading(false);
          return;
        }

        // Tentamos buscar o e-mail do paciente. 
        // Nota: Se o RLS bloquear, usaremos um fallback ou pediremos o e-mail no form.
        const { data: patient } = await supabase
          .from('patients')
          .select('full_name, email')
          .eq('id', access.patient_id)
          .maybeSingle();

        setInviteData(access);
        if (patient) {
          setPatientEmail(patient.email);
        }
      } catch (err) {
        console.error("Erro na validação do token:", err);
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
      // 1. Criar o usuário no Supabase Auth
      // Usamos o e-mail que veio do banco ou o que o usuário confirmar
      const emailToUse = patientEmail;
      
      if (!emailToUse) {
        throw new Error("E-mail do paciente não identificado. Entre em contato com seu psicólogo.");
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailToUse,
        password: password,
        options: {
          data: {
            role: 'patient',
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Vincular o novo user_id ao registro de acesso do paciente
        const { error: updateError } = await supabase
          .from('patient_access')
          .update({
            user_id: authData.user.id,
            status: 'active',
            invite_token: null, // Invalida o token após uso
            updated_at: new Date().toISOString()
          })
          .eq('id', inviteData.id);

        if (updateError) {
          console.error("Erro ao vincular conta:", updateError);
          // Mesmo com erro aqui, a conta auth foi criada. 
          // O ideal seria um fallback ou log, mas vamos avisar o erro.
          throw new Error("Conta criada, mas houve um erro no vínculo clínico. Tente fazer login ou fale com seu psicólogo.");
        }

        showSuccess("Conta ativada com sucesso! Agora você pode entrar.");
        navigate("/login");
      } else {
        // Caso o Supabase exija confirmação de e-mail (depende da config do projeto)
        showSuccess("Verifique seu e-mail para confirmar o cadastro e ativar sua conta.");
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
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Validando convite...</p>
    </div>
  );

  if (!inviteData) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full text-center p-6 rounded-[32px] border-none shadow-xl">
          <CardHeader>
            <div className="mx-auto h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-black">Convite Inválido</CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-2">
              Este link de acesso expirou, já foi utilizado ou nunca existiu. 
              Peça um novo convite ao seu psicólogo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/login")} variant="outline" className="w-full rounded-2xl h-12 font-bold border-slate-200">
              Ir para Login
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
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Crie seu Acesso</CardTitle>
          <CardDescription className="font-medium px-4">
            Defina uma senha segura para acessar seu portal terapêutico.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleActivate} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Seu E-mail de Acesso</Label>
              <Input 
                value={patientEmail || "E-mail vinculado ao prontuário"} 
                disabled 
                className="bg-slate-50 rounded-2xl h-12 border-slate-100 text-slate-500 font-medium" 
              />
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
                "Ativar Minha Conta"
              )}
            </Button>
          </form>
        </CardContent>
        <div className="bg-slate-50 p-6 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck className="h-3 w-3" /> Conexão Segura e Criptografada
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ActivateAccount;
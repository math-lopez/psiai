"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ShieldCheck, BrainCircuit } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('patient_access')
        .select('*, patients(full_name, email)')
        .eq('invite_token', token)
        .eq('status', 'invited')
        .maybeSingle();

      if (error || !data) {
        showError("Convite inválido ou já utilizado.");
        setLoading(false);
        return;
      }

      setInviteData(data);
      setLoading(false);
    };

    validateToken();
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showError("As senhas não coincidem.");
      return;
    }

    setValidating(true);
    try {
      // 1. Criar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.patients.email,
        password: password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Atualizar o registro de acesso
        const { error: updateError } = await supabase
          .from('patient_access')
          .update({
            user_id: authData.user.id,
            status: 'active',
            invite_token: null, // Queima o token após uso
            updated_at: new Date().toISOString()
          })
          .eq('id', inviteData.id);

        if (updateError) throw updateError;

        showSuccess("Conta ativada com sucesso! Bem-vindo(a).");
        navigate("/login");
      }
    } catch (err: any) {
      showError(err.message || "Erro ao ativar conta.");
    } finally {
      setValidating(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  if (!inviteData) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full text-center p-6 rounded-[32px]">
          <CardHeader>
            <div className="mx-auto h-12 w-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle>Link Inválido</CardTitle>
            <CardDescription>Este link de convite expirou ou não é mais válido. Entre em contato com seu psicólogo.</CardDescription>
          </CardHeader>
          <Button onClick={() => navigate("/login")} variant="outline" className="mt-4 rounded-2xl">Voltar para Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-indigo-600">
      <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden">
        <div className="h-2 w-full bg-indigo-400" />
        <CardHeader className="text-center pt-10">
          <div className="flex justify-center mb-4">
            <BrainCircuit className="h-12 w-12 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900">Ative seu Portal</CardTitle>
          <CardDescription className="font-medium">
            Olá, <span className="text-indigo-600 font-bold">{inviteData.patients.full_name}</span>. 
            Crie sua senha para acessar seu espaço terapêutico.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail de Acesso</Label>
              <Input value={inviteData.patients.email} disabled className="bg-slate-50 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass">Criar Senha</Label>
              <Input 
                id="pass" 
                type="password" 
                required 
                className="rounded-xl h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar Senha</Label>
              <Input 
                id="confirm" 
                type="password" 
                required 
                className="rounded-xl h-12"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl font-black mt-4 shadow-lg shadow-indigo-100"
              disabled={validating}
            >
              {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ativar Minha Conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivateAccount;
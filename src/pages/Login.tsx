import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BrainCircuit, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showError, showSuccess } from "@/utils/toast";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [crp, setCrp] = useState("");

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "no-access") {
      showError("Esta conta não possui um vínculo ativo ou perfil profissional configurado.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // 1. Verifica se é Psicólogo (tem CRP no perfil)
        const { data: profile } = await supabase
          .from('profiles')
          .select('crp')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile && profile.crp) {
          showSuccess("Bem-vindo(a) Dra/Dr!");
          navigate("/dashboard");
          return;
        }

        // 2. AUTO-VÍNCULO: Tenta achar um prontuário pelo e-mail do usuário
        // Se o user_id estiver nulo no patient_access, a gente vincula agora
        const { data: patientData } = await supabase
          .from('patients')
          .select('id, email, patient_access(id, user_id, status)')
          .eq('email', data.user.email)
          .maybeSingle();

        if (patientData) {
          const access = Array.isArray(patientData.patient_access) 
            ? patientData.patient_access[0] 
            : patientData.patient_access;

          if (access) {
            // Se o prontuário existe mas não tem o ID do usuário ainda, vincula!
            if (!access.user_id) {
              await supabase
                .from('patient_access')
                .update({ user_id: data.user.id, status: 'active', invite_token: null })
                .eq('id', access.id);
            }

            if (patientData.status === 'inativo') {
              await supabase.auth.signOut();
              showError("Seu prontuário está inativo. Procure seu psicólogo.");
              return;
            }

            showSuccess("Bem-vindo ao seu Portal!");
            navigate("/portal");
            return;
          }
        }

        // 3. Fallback se nada funcionar
        console.warn("[Login] Usuário sem papel detectado.");
        await supabase.auth.signOut();
        showError("Acesso negado: Sua conta não possui vínculo clínico ativo.");
      }
    } catch (error: any) {
      showError(error.message || "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            crp: crp,
          },
        },
      });
      if (error) throw error;
      showSuccess("Cadastro realizado! Verifique seu e-mail para confirmar.");
    } catch (error: any) {
      showError(error.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <BrainCircuit className="h-12 w-12 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">PsiAI</h1>
            <p className="mt-2 text-slate-600">Sua assistente inteligente para gestão clínica</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl font-black shadow-lg shadow-indigo-100" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Entrar no Sistema"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nome Completo</Label>
                  <Input 
                    id="reg-name" 
                    placeholder="Seu nome completo" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-crp">Número do CRP</Label>
                  <Input 
                    id="reg-crp" 
                    placeholder="Ex: 06/123456" 
                    value={crp}
                    onChange={(e) => setCrp(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">E-mail</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Senha</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl font-black" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Criar Minha Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-10">
            Privacidade e Segurança em conformidade com a LGPD.
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 h-64 w-64 rounded-full border-4 border-white" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full border-4 border-white" />
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-black mb-6 italic leading-tight">"A tecnologia como aliada da escuta analítica."</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center font-bold">✓</div>
              <p className="font-medium">Transcrição automática de sessões</p>
            </div>
            <div className="flex gap-4">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center font-bold">✓</div>
              <p className="font-medium">Extração inteligente de insights terapêuticos</p>
            </div>
            <div className="flex gap-4">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center font-bold">✓</div>
              <p className="font-medium">Prontuário eletrônico completo e seguro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
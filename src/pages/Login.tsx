import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess } from "@/utils/toast";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulação de login
    setTimeout(() => {
      setLoading(false);
      showSuccess("Login realizado com sucesso!");
      navigate("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <BrainCircuit className="h-12 w-12 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">PsiAI</h1>
            <p className="mt-2 text-slate-600">Sua assistente inteligente para gestão clínica</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <button type="button" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  Esqueceu a senha?
                </button>
              </div>
              <Input id="password" type="password" required />
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-11" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar no sistema"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Segurança em conformidade com a LGPD e padrões éticos do CFP.
          </p>
        </div>
      </div>

      {/* Lado Direito - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 h-64 w-64 rounded-full border-4 border-white" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full border-4 border-white" />
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold mb-6 italic">"A tecnologia como aliada da escuta analítica."</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">✓</div>
              <p>Transcrição automática de sessões</p>
            </div>
            <div className="flex gap-4">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">✓</div>
              <p>Extração inteligente de insights terapêuticos</p>
            </div>
            <div className="flex gap-4">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">✓</div>
              <p>Prontuário eletrônico completo e seguro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
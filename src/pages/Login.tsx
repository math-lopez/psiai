import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit } from "lucide-react";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

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

          <div className="p-4 border rounded-xl shadow-sm">
            <Auth
              supabaseClient={supabase}
              providers={[]}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#4f46e5',
                      brandAccent: '#4338ca',
                    }
                  }
                }
              }}
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'E-mail',
                    password_label: 'Senha',
                    button_label: 'Entrar',
                    loading_button_label: 'Entrando...',
                    email_input_placeholder: 'seu@email.com',
                    password_input_placeholder: 'Sua senha',
                    link_text: 'Já tem uma conta? Entre',
                  },
                  sign_up: {
                    email_label: 'E-mail',
                    password_label: 'Senha',
                    button_label: 'Cadastrar',
                    loading_button_label: 'Cadastrando...',
                    link_text: 'Não tem uma conta? Cadastre-se',
                  },
                  forgotten_password: {
                    link_text: 'Esqueceu sua senha?',
                    button_label: 'Recuperar senha',
                    loading_button_label: 'Enviando instruções...',
                    email_label: 'E-mail',
                    email_input_placeholder: 'seu@email.com',
                  }
                }
              }}
              theme="light"
            />
          </div>

          <p className="text-center text-sm text-slate-500">
            Segurança em conformidade com a LGPD e padrões éticos do CFP.
          </p>
        </div>
      </div>

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
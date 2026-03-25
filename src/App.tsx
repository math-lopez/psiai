import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { PatientPortalLayout } from "./components/layout/PatientPortalLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientFormPage from "./pages/PatientFormPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import Sessions from "./pages/Sessions";
import SessionFormPage from "./pages/SessionFormPage";
import SessionDetail from "./pages/SessionDetail";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";

// Portal do Paciente
import ActivateAccount from "./pages/portal/ActivateAccount";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PatientDiaryPage from "./pages/portal/PatientDiaryPage";

const queryClient = new QueryClient();

/**
 * RoleProtectedRoute 2.0:
 * Bloqueio total até que o banco de dados confirme quem é o usuário.
 */
const RoleProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole: 'psychologist' | 'patient' }) => {
  const { session, loading: authLoading, signOut } = useAuth();
  const [userRole, setUserRole] = useState<'psychologist' | 'patient' | 'unknown' | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const identifyUser = async () => {
      if (!session) {
        setChecking(false);
        return;
      }

      try {
        console.log(`[AuthGuard] Verificando papel para ${session.user.email}...`);
        
        // 1. Tenta encontrar na tabela de pacientes
        const { data: patientData } = await supabase
          .from('patient_access')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (patientData) {
          console.log("[AuthGuard] Papel confirmado: PACIENTE");
          setUserRole('patient');
          setChecking(false);
          return;
        }

        // 2. Se não for paciente, verifica se é psicólogo no perfil
        // No seu sistema, psicólogos têm CRP no perfil.
        const { data: profileData } = await supabase
          .from('profiles')
          .select('crp')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileData && profileData.crp) {
          console.log("[AuthGuard] Papel confirmado: PSICÓLOGO");
          setUserRole('psychologist');
        } else {
          console.log("[AuthGuard] Usuário não identificado em nenhuma categoria.");
          setUserRole('unknown');
        }
      } catch (err) {
        console.error("[AuthGuard] Erro crítico na identificação:", err);
        setUserRole('unknown');
      } finally {
        setChecking(false);
      }
    };

    if (!authLoading) identifyUser();
  }, [session, authLoading]);

  // Enquanto verifica, não renderiza NADA das rotas protegidas
  if (authLoading || checking) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Garantindo acesso seguro...</p>
      </div>
    );
  }

  // Se não tem sessão, tchau.
  if (!session) return <Navigate to="/login" replace />;

  // Se o papel for incompatível com a rota, redireciona para o portal correto
  if (userRole === 'patient' && requiredRole === 'psychologist') {
    return <Navigate to="/portal" replace />;
  }

  if (userRole === 'psychologist' && requiredRole === 'patient') {
    return <Navigate to="/dashboard" replace />;
  }

  // Se o usuário não foi identificado (ex: conta mal formada), desloga para segurança
  if (userRole === 'unknown') {
    signOut();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" closeButton />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/portal/ativar" element={<ActivateAccount />} />
            
            {/* Rotas Clínicas (Só Psicólogos) */}
            <Route element={<RoleProtectedRoute requiredRole="psychologist"><AppLayout /></RoleProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pacientes" element={<Patients />} />
              <Route path="/pacientes/novo" element={<PatientFormPage />} />
              <Route path="/pacientes/editar/:id" element={<PatientFormPage />} />
              <Route path="/pacientes/:id" element={<PatientDetailPage />} />
              <Route path="/sessoes" element={<Sessions />} />
              <Route path="/sessoes/nova" element={<SessionFormPage />} />
              <Route path="/sessoes/editar/:id" element={<SessionFormPage />} />
              <Route path="/sessoes/:id" element={<SessionDetail />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/assinatura" element={<Subscription />} />
            </Route>

            {/* Rotas Terapêuticas (Só Pacientes) */}
            <Route element={<RoleProtectedRoute requiredRole="patient"><PatientPortalLayout /></RoleProtectedRoute>}>
              <Route path="/portal" element={<PortalDashboard />} />
              <Route path="/portal/diario" element={<PatientDiaryPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Analytics />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
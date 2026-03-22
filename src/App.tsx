import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
 * Guarda de Rota Inteligente: 
 * Verifica se o usuário tem permissão para estar naquela área (Psicólogo vs Paciente)
 */
const RoleProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole: 'psychologist' | 'patient' }) => {
  const { session, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<'psychologist' | 'patient' | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!session) {
        setCheckingRole(false);
        return;
      }

      try {
        console.log("[RoleGuard] Verificando papel para:", session.user.email);
        
        // Verifica se o ID do usuário logado existe na tabela de acessos de pacientes
        const { data, error } = await supabase
          .from('patient_access')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (error) throw error;

        const role = data ? 'patient' : 'psychologist';
        console.log("[RoleGuard] Papel detectado:", role);
        setUserRole(role);
      } catch (e) {
        console.error("[RoleGuard] Erro ao verificar papel:", e);
        // Em caso de erro crítico, não assumimos papel nenhum para segurança
      } finally {
        setCheckingRole(false);
      }
    };

    if (!authLoading) {
      checkRole();
    }
  }, [session, authLoading]);
  
  if (authLoading || checkingRole) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Validando credenciais...</p>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  // Se não conseguimos determinar o papel, mandamos para o Index para re-tentar
  if (!userRole) return <Navigate to="/" replace />;

  // Redirecionamento cruzado: Se o paciente tentar entrar na área do psicólogo ou vice-versa
  if (requiredRole === 'psychologist' && userRole === 'patient') {
    console.log("[RoleGuard] Bloqueando Paciente de acessar área do Psicólogo.");
    return <Navigate to="/portal" replace />;
  }
  
  if (requiredRole === 'patient' && userRole === 'psychologist') {
    console.log("[RoleGuard] Bloqueando Psicólogo de acessar área do Paciente.");
    return <Navigate to="/dashboard" replace />;
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
            
            {/* Área do Psicólogo (Protegida) */}
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

            {/* Área do Paciente (Portal Protegido) */}
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
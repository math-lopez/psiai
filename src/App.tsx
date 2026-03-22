import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";

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

// Rotas do Paciente (v81)
import PatientDashboard from "./pages/PatientDashboard";
import PatientDiary from "./pages/PatientDiary";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen flex items-center justify-center font-black text-indigo-600 animate-pulse">PsiAI...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" closeButton />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                {/* Rotas do Psicólogo */}
                <Route path="/" element={<Dashboard />} />
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

                {/* Rotas do Portal do Paciente (v81) */}
                <Route path="/meu-painel" element={<PatientDashboard />} />
                <Route path="/meu-diario" element={<PatientDiary />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Analytics />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
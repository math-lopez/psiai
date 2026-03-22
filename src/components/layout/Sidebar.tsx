"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, CalendarDays, Settings, LogOut, BrainCircuit, X, ChevronRight, Book, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { diaryService } from "@/services/diaryService";

export const Sidebar = ({ isMobile, onpjClose }: { isMobile?: boolean; onpjClose?: () => void }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const [role, setRole] = useState<'psychologist' | 'patient'>('psychologist');

  useEffect(() => {
    const checkRole = async () => {
      const context = await diaryService.getPatientContext();
      if (context) setRole('patient');
      else setRole('psychologist');
    };
    checkRole();
  }, []);

  const psychologistMenu = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Users, label: "Pacientes", path: "/pacientes" },
    { icon: CalendarDays, label: "Sessões", path: "/sessoes" },
    { icon: Settings, label: "Configurações", path: "/configuracoes" },
  ];

  const patientMenu = [
    { icon: Sparkles, label: "Meu Painel", path: "/meu-painel" },
    { icon: Book, label: "Meu Diário", path: "/meu-diario" },
    { icon: Settings, label: "Configurações", path: "/configuracoes" },
  ];

  const currentMenu = role === 'patient' ? patientMenu : psychologistMenu;

  return (
    <div className={cn("flex h-screen flex-col bg-white border-r border-slate-100 transition-all duration-300", isMobile ? "w-full" : "w-72")}>
      <div className="flex h-20 items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-indigo-600/10 p-2 rounded-xl group-hover:bg-indigo-600/20 transition-colors">
            <BrainCircuit className="h-7 w-7 text-indigo-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">PsiAI</span>
        </Link>
        {isMobile && <button onClick={onpjClose} className="p-2 text-slate-400"><X className="h-6 w-6" /></button>}
      </div>
      
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {currentMenu.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link key={item.path} to={item.path} className={cn("group flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all", isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:bg-slate-50")}>
              <div className="flex items-center gap-3">
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600")} />
                {item.label}
              </div>
              {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <button onClick={() => signOut()} className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
          <LogOut className="h-5 w-5" /> Sair do sistema
        </button>
      </div>
    </div>
  );
};
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
    <div className={cn(
      "flex h-screen flex-col bg-[#0F172A] text-slate-300 transition-all duration-300", 
      isMobile ? "w-full" : "w-72"
    )}>
      <div className="flex h-24 items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-indigo-500 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tighter">PsiAI</span>
        </Link>
        {isMobile && <button onClick={onpjClose} className="p-2 text-slate-400"><X className="h-6 w-6" /></button>}
      </div>
      
      <nav className="flex-1 space-y-2 px-4 py-4">
        <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Menu Principal</p>
        {currentMenu.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={cn(
                "group flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200", 
                isActive 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400")} />
                {item.label}
              </div>
              {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button 
          onClick={() => signOut()} 
          className="flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="h-5 w-5" /> Sair do sistema
        </button>
      </div>
    </div>
  );
};
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
      "flex h-screen flex-col bg-[#0A0F1E] text-slate-400 transition-all duration-300 border-r border-white/5", 
      isMobile ? "w-full" : "w-72"
    )}>
      <div className="flex h-28 items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-[18px] shadow-lg shadow-indigo-500/30 group-hover:rotate-6 transition-all duration-300">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tighter">PsiAI</span>
        </Link>
        {isMobile && <button onClick={onpjClose} className="p-2 text-slate-400"><X className="h-6 w-6" /></button>}
      </div>
      
      <nav className="flex-1 space-y-1.5 px-4 py-4">
        <p className="px-5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 mb-6">Menu Principal</p>
        {currentMenu.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={cn(
                "group flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300", 
                isActive 
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-[0_0_20px_rgba(79,70,229,0.1)]" 
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon className={cn("h-5 w-5 transition-colors duration-300", isActive ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-300")} />
                {item.label}
              </div>
              {isActive && (
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#4f46e5]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5 bg-[#0D1326]/50">
        <button 
          onClick={() => signOut()} 
          className="flex w-full items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group"
        >
          <LogOut className="h-5 w-5 text-slate-600 group-hover:text-red-400 transition-colors" /> 
          Sair do sistema
        </button>
      </div>
    </div>
  );
};
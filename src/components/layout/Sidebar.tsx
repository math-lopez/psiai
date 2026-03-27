"use client";

import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  Settings, 
  LogOut,
  BrainCircuit,
  X,
  ChevronRight,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
  { icon: Users, label: "Pacientes", path: "/pacientes", tourId: "menu-patients" },
  { icon: CalendarDays, label: "Sessões", path: "/sessoes", tourId: "menu-sessions" },
  { icon: Settings, label: "Configurações", path: "/configuracoes", tourId: "menu-settings" },
];

interface SidebarProps {
  isMobile?: boolean;
  onpjClose?: () => void;
}

export const Sidebar = ({ isMobile, onpjClose }: SidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div 
      data-tour="sidebar"
      className={cn(
        "flex h-screen flex-col bg-white border-r border-slate-100 transition-all duration-300",
        isMobile ? "w-full" : "w-72"
      )}
    >
      <div className="flex h-20 items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <BrainCircuit className="h-7 w-7 text-primary" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">PsiAI</span>
        </Link>
        {isMobile && (
          <button onClick={onpjClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              data-tour={item.tourId}
              className={cn(
                "group flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                {item.label}
              </div>
              {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Sessão</p>
          <button 
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair do sistema
          </button>
        </div>
      </div>
    </div>
  );
};
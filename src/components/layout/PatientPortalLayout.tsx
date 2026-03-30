"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  BrainCircuit, 
  BookOpen, 
  LayoutDashboard, 
  LogOut, 
  Bell,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export const PatientPortalLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: "Início", path: "/portal" },
    { icon: BookOpen, label: "Meu Diário", path: "/portal/diario" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-100 sticky top-0 h-screen">
        <div className="h-20 flex items-center px-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Meu Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={async () => { await signOut(); navigate("/login"); }}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Mobile/Tablet */}
        <header className="h-20 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-50 md:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Meu Portal</span>
          </div>
          <button className="p-2.5 text-slate-400 hover:text-indigo-600 transition-colors">
            <Bell className="h-5.5 w-5.5" />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
          <div className="page-transition">
            <Outlet />
          </div>
        </main>

        {/* Mobile Navigation (Bottom) */}
        <nav className="h-20 bg-white border-t border-slate-100 px-8 flex items-center justify-around sticky bottom-0 z-50 md:hidden">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 transition-colors",
                  isActive ? "text-indigo-600" : "text-slate-400"
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-[10px] font-bold uppercase">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
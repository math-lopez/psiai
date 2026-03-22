"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  BrainCircuit, 
  BookOpen, 
  LayoutDashboard, 
  LogOut, 
  Bell,
  ChevronRight,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const PatientPortalLayout = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: "Meu Início", path: "/portal" },
    { icon: BookOpen, label: "Meu Diário", path: "/portal/diario" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-100 flex-col sticky top-0 h-screen">
        <div className="h-20 flex items-center px-8 border-b border-slate-50">
          <Link to="/portal" className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">PsiAI</span>
          </Link>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 mb-4">Navegação</p>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600")} />
                  {item.label}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-slate-50 rounded-3xl p-4 space-y-4 border border-slate-100">
            <div className="flex items-center gap-3 px-1">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 truncate">Sua Conta</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sair do Portal
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden h-20 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight">PsiAI</span>
          </div>
          <button 
            onClick={handleSignOut}
            className="p-2.5 text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-10 lg:p-12 max-w-5xl mx-auto w-full">
          <div className="page-transition">
            <Outlet />
          </div>
        </main>

        {/* Mobile Nav (Floating style) */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl shadow-2xl flex items-center justify-around z-50 px-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300 px-6 py-2 rounded-2xl",
                  isActive ? "text-indigo-600 scale-110" : "text-slate-400"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "fill-indigo-50" : "")} />
                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
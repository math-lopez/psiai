"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BrainCircuit, BookOpen, LayoutDashboard, LogOut, Bell } from "lucide-react";
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">Meu Portal</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2.5 text-slate-400 hover:text-indigo-600 transition-colors">
            <Bell className="h-5.5 w-5.5" />
          </button>
          <button 
            onClick={async () => { await signOut(); navigate("/login"); }}
            className="p-2.5 text-slate-400 hover:text-red-500 transition-colors"
            title="Sair"
          >
            <LogOut className="h-5.5 w-5.5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
        <div className="page-transition">
          <Outlet />
        </div>
      </main>

      {/* Mobile Navigation */}
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
  );
};
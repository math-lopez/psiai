"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  BrainCircuit, 
  BookOpen, 
  LayoutDashboard, 
  LogOut, 
  Bell,
  ChevronRight,
  UserCircle,
  ChevronDown,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export const PatientPortalLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [allAccess, setAllAccess] = useState<any[]>([]);
  const [selectedAccess, setSelectedAccess] = useState<any>(null);

  useEffect(() => {
    const fetchVenculos = async () => {
      if (!user) return;
      try {
        const { data: accessList, error } = await supabase
          .from('patient_access')
          .select(`
            *,
            patients!inner(full_name, status),
            psychologist:profiles(*)
          `)
          .eq('user_id', user.id)
          .eq('patients.status', 'ativo')
          .order('updated_at', { ascending: false });

        if (error) throw error;

        setAllAccess(accessList || []);
        
        const savedId = localStorage.getItem('psiai_selected_patient_id');
        const initial = accessList?.find(a => a.patient_id === savedId) || accessList?.[0];
        
        if (initial) {
          setSelectedAccess(initial);
          localStorage.setItem('psiai_selected_patient_id', initial.patient_id);
        }
      } catch (err) {
        console.error("[PortalLayout] Erro:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVenculos();
  }, [user]);

  const handleSelectProfessional = (access: any) => {
    setSelectedAccess(access);
    localStorage.setItem('psiai_selected_patient_id', access.patient_id);
    // Recarrega a página atual para atualizar os dados dos módulos (Diário, Arquivos, etc)
    window.location.reload();
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Início", path: "/portal" },
    { icon: BookOpen, label: "Meu Diário", path: "/portal/diario" },
  ];

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-100 sticky top-0 h-screen">
        <div className="h-20 flex items-center px-8 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Meu Portal</span>
          </div>
        </div>

        {/* Seletor de Profissional (Sidebar) */}
        <div className="px-4 py-6 border-b border-slate-50">
          <p className="text-[9px] font-black uppercase text-slate-400 px-4 mb-2 tracking-widest">Acompanhamento com:</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 transition-colors border border-slate-100 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-600 group-hover:scale-110 transition-transform">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{selectedAccess?.psychologist?.full_name || 'Profissional'}</p>
                    <p className="text-[10px] text-slate-400 font-medium">CRP: {selectedAccess?.psychologist?.crp || '-'}</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2 ml-4">
              {allAccess.map((access) => (
                <DropdownMenuItem 
                  key={access.patient_id} 
                  onClick={() => handleSelectProfessional(access)}
                  className={cn(
                    "rounded-xl py-3 cursor-pointer",
                    selectedAccess?.patient_id === access.patient_id ? "bg-indigo-50 text-indigo-700 font-bold" : "font-medium"
                  )}
                >
                  {access.psychologist?.full_name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
        {/* Header Mobile */}
        <header className="h-20 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-50 md:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Meu Portal</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 text-indigo-600 bg-indigo-50 rounded-xl">
                <UserCircle className="h-6 w-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
              {allAccess.map((access) => (
                <DropdownMenuItem key={access.patient_id} onClick={() => handleSelectProfessional(access)} className="rounded-xl py-3 font-bold">
                  {access.psychologist?.full_name}
                </DropdownMenuItem>
              ))}
              <div className="h-px bg-slate-100 my-2" />
              <DropdownMenuItem onClick={async () => { await signOut(); navigate("/login"); }} className="text-red-500 font-bold rounded-xl py-3">
                Sair da Conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
          <div className="page-transition">
            <Outlet />
          </div>
        </main>

        {/* Bottom Nav Mobile */}
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
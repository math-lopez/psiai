import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  Settings, 
  LogOut,
  BrainCircuit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Pacientes", path: "/pacientes" },
  { icon: CalendarDays, label: "Sessões", path: "/sessoes" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center px-6 border-b">
        <Link to="/" className="flex items-center gap-2">
          <BrainCircuit className="h-8 w-8 text-indigo-600" />
          <span className="text-xl font-bold text-slate-900">PsiAI</span>
        </Link>
      </div>
      
      <nav className="flex-1 space-y-1 px-4 py-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname === item.path
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button 
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sair do sistema
        </button>
      </div>
    </div>
  );
};
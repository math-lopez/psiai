import { useAuth } from "@/contexts/AuthContext";
import { Bell, UserCircle, Loader2 } from "lucide-react";

export const Header = () => {
  const { user, loading } = useAuth();

  // Extrai dados dos metadados do Supabase Auth
  const fullName = user?.user_metadata?.full_name || user?.email || "Usuário";
  const crp = user?.user_metadata?.crp || "CRP não informado";

  return (
    <header className="h-16 border-b bg-white px-8 flex items-center justify-between">
      <div>
        <h2 className="text-sm font-medium text-slate-500">Bem-vindo(a) de volta,</h2>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : (
          <p className="text-lg font-semibold text-slate-900">{fullName}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        <div className="h-8 w-[1px] bg-slate-200 mx-2" />
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{fullName}</p>
            <p className="text-xs text-slate-500">{crp}</p>
          </div>
          <UserCircle className="h-10 w-10 text-slate-300" />
        </div>
      </div>
    </header>
  );
};
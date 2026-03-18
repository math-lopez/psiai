import { mockUser } from "@/lib/mockData";
import { Bell, UserCircle } from "lucide-react";

export const Header = () => {
  return (
    <header className="h-16 border-b bg-white px-8 flex items-center justify-between">
      <div>
        <h2 className="text-sm font-medium text-slate-500">Bem-vindo(a) de volta,</h2>
        <p className="text-lg font-semibold text-slate-900">{mockUser.name}</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        <div className="h-8 w-[1px] bg-slate-200 mx-2" />
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{mockUser.name}</p>
            <p className="text-xs text-slate-500">{mockUser.crp}</p>
          </div>
          <UserCircle className="h-10 w-10 text-slate-300" />
        </div>
      </div>
    </header>
  );
};
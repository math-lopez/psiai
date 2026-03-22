"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Bell, UserCircle, Loader2, CheckCircle2, AlertCircle, Trash2, Menu, Search } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, loading } = useAuth();
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();

  const fullName = user?.user_metadata?.full_name || user?.email || "Usuário";
  const crp = user?.user_metadata?.crp || "CRP";

  return (
    <header className="sticky top-0 z-30 h-24 px-4 md:px-10 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-3 text-slate-500 hover:bg-white rounded-2xl shadow-sm transition-all"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <div className="hidden md:flex items-center bg-white border border-slate-200/60 rounded-2xl px-4 py-2 w-72 shadow-sm focus-within:ring-2 ring-indigo-500/20 transition-all">
          <Search className="h-4 w-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="bg-transparent border-none text-sm focus:outline-none w-full text-slate-600 font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <Popover onOpenChange={(open) => {
          if (open && unreadCount > 0) {
            markAllAsRead();
          }
        }}>
          <PopoverTrigger asChild>
            <button className="relative p-3 text-slate-500 bg-white hover:text-indigo-600 rounded-2xl shadow-sm border border-slate-200/60 transition-all hover:scale-105 active:scale-95 focus:outline-none">
              <Bell className="h-5.5 w-5.5" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 h-4 w-4 bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 shadow-2xl border-none rounded-[28px] overflow-hidden mt-2" align="end">
            <div className="p-5 border-b flex items-center justify-between bg-slate-50/50">
              <h4 className="font-black text-xs uppercase tracking-widest text-slate-500">Notificações</h4>
              {notifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-1 text-[10px] font-black text-slate-400 hover:text-red-500" 
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotifications();
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Limpar
                </Button>
              )}
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-5 flex gap-4 transition-colors ${!n.read ? 'bg-indigo-50/30' : 'bg-white'}`}>
                      {n.type === 'success' ? (
                        <div className="mt-1 bg-emerald-100 p-2 rounded-xl shrink-0 h-fit">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="mt-1 bg-red-100 p-2 rounded-xl shrink-0 h-fit">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-900 leading-tight">{n.title}</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{n.message}</p>
                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-wider">
                          {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tudo em dia!</p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-900 leading-none mb-1">{fullName}</p>
            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.1em]">{crp}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-center text-indigo-600 font-black shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
            {fullName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
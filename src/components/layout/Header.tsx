"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Bell, UserCircle, Loader2, CheckCircle2, AlertCircle, Trash2, Menu } from "lucide-react";
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
    <header className="sticky top-0 z-30 h-20 border-b border-slate-100 bg-white/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bem-vindo(a)</h2>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <p className="text-lg font-bold text-slate-900 truncate max-w-[200px] md:max-w-xs">{fullName}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Popover onOpenChange={(open) => {
          if (open && unreadCount > 0) {
            markAllAsRead();
          }
        }}>
          <PopoverTrigger asChild>
            <button className="relative p-2.5 text-slate-400 hover:text-primary rounded-xl hover:bg-slate-50 transition-all focus:outline-none">
              <Bell className="h-5.5 w-5.5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-4.5 w-4.5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 shadow-2xl border-slate-200 rounded-2xl overflow-hidden" align="end">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
              <h4 className="font-bold text-sm text-slate-900">Notificações</h4>
              {notifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-1 text-[10px] text-slate-500 hover:text-red-500" 
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
                    <div key={n.id} className={`p-4 flex gap-3 transition-colors ${!n.read ? 'bg-primary/5' : 'bg-white'}`}>
                      {n.type === 'success' ? (
                        <div className="mt-1 bg-emerald-100 p-1.5 rounded-full shrink-0 h-fit">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="mt-1 bg-red-100 p-1.5 rounded-full shrink-0 h-fit">
                          <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900">{n.title}</p>
                        <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                          {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Bell className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-medium">Tudo em dia!</p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-10 w-[1px] bg-slate-100 mx-1 md:mx-2" />
        
        <div className="flex items-center gap-3 pl-1">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-900">{fullName}</p>
            <p className="text-[9px] text-primary font-black uppercase tracking-widest">{crp}</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black border-2 border-white shadow-sm transition-transform hover:scale-105">
            {fullName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
import { useAuth } from "@/contexts/AuthContext";
import { Bell, UserCircle, Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Header = () => {
  const { user, loading } = useAuth();
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();

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
        <Popover onOpenChange={(open) => {
          if (open && unreadCount > 0) {
            markAllAsRead();
          }
        }}>
          <PopoverTrigger asChild>
            <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors focus:outline-none">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 shadow-xl border-slate-200" align="end">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
              <h4 className="font-bold text-sm text-slate-900">Notificações</h4>
              {notifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-1 text-[10px] text-slate-500 hover:text-red-500 hover:bg-red-50" 
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotifications();
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Limpar tudo
                </Button>
              )}
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-4 flex gap-3 transition-colors ${!n.read ? 'bg-indigo-50/40' : 'bg-white'}`}>
                      {n.type === 'success' ? (
                        <div className="mt-1 bg-emerald-100 p-1 rounded-full shrink-0 h-fit">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="mt-1 bg-red-100 p-1 rounded-full shrink-0 h-fit">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">{n.title}</p>
                        <p className="text-[11px] text-slate-600 leading-tight">{n.message}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-500">Você não tem novas notificações.</p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-8 w-[1px] bg-slate-200 mx-2" />
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900">{fullName}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{crp}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
            {fullName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
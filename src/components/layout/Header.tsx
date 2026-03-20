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
        <Popover onOpenChange={(open) => open && markAllAsRead()}>
          <PopoverTrigger asChild>
            <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 border-b flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">Notificações</h4>
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-slate-500 hover:text-red-500" onClick={clearNotifications}>
                  <Trash2 className="h-3 w-3 mr-1" /> Limpar
                </Button>
              )}
            </div>
            <div className="max-h-[300px] overflow-auto">
              {notifications.length > 0 ? (
                <div className="divide-y">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-4 flex gap-3 ${!n.read ? 'bg-indigo-50/50' : 'bg-white'}`}>
                      {n.type === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                      )}
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-400">
                          {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Nenhuma notificação por enquanto.</p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

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
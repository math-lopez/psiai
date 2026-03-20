import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/utils/toast";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error';
  read: boolean;
  createdAt: Date;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    console.log("[useNotifications] Iniciando subscrição em tempo real para o usuário:", user.id);

    // Canal para ouvir mudanças nas sessões do usuário logado
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `psychologist_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new.processing_status;
          
          // Notifica se o status mudou para concluído ou erro
          if (newStatus === 'completed' || newStatus === 'error') {
            const isSuccess = newStatus === 'completed';
            const title = isSuccess ? "Processamento Concluído" : "Erro no Processamento";
            const message = isSuccess 
              ? `A IA finalizou a transcrição de uma sessão.` 
              : `Houve um erro ao processar o áudio de uma sessão.`;

            const newNotif: Notification = {
              id: Math.random().toString(36).substr(2, 9),
              title,
              message,
              type: isSuccess ? 'success' : 'error',
              read: false,
              createdAt: new Date(),
            };

            setNotifications(prev => [newNotif, ...prev]);
            
            // Também mostramos um toast para feedback imediato
            if (isSuccess) showSuccess(message);
            else showError(message);
          }
        }
      )
      .subscribe((status) => {
        console.log("[useNotifications] Status da subscrição:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAllAsRead, clearNotifications };
};
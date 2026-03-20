import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

    const channel = supabase
      .channel(`notifs-${user.id}`)
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
          
          if (newStatus === 'completed' || newStatus === 'error') {
            const isSuccess = newStatus === 'completed';
            const newNotif: Notification = {
              id: Math.random().toString(36).substr(2, 9),
              title: isSuccess ? "Sessão Processada" : "Erro no Processamento",
              message: isSuccess ? "A transcrição da sua sessão está pronta." : "Ocorreu um erro ao processar o áudio.",
              type: isSuccess ? 'success' : 'error',
              read: false,
              createdAt: new Date(),
            };

            setNotifications(prev => [newNotif, ...prev]);
          }
        }
      )
      .subscribe();

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
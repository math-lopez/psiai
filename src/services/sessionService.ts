import { supabase } from "@/integrations/supabase/client";
import { Session, DashboardStats } from "@/types";
import { storageService } from "./storageService";
import { PLAN_LIMITS, SubscriptionTier } from "@/config/plans";
import { startOfMonth, endOfMonth } from "date-fns";

export const sessionService = {
  list: async (): Promise<Session[]> => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, patient:patients(full_name)')
      .order('session_date', { ascending: false });
    
    if (error) throw error;
    return data as Session[];
  },

  getById: async (id: string): Promise<Session | null> => {
    if (!id) return null;
    const { data, error } = await supabase
      .from('sessions')
      .select('*, patient:patients(full_name)')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Session;
  },

  create: async (sessionData: any, audioFile?: File): Promise<Session> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    // Verificar Limites do Plano (Sessões Mensais)
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = (profile?.subscription_tier as SubscriptionTier) || 'free';
    const limit = PLAN_LIMITS[tier].maxSessionsPerMonth;

    const start = startOfMonth(new Date()).toISOString();
    const end = endOfMonth(new Date()).toISOString();

    const { count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start)
      .lte('created_at', end);

    if (count !== null && count >= limit) {
      throw new Error(`Limite mensal atingido! Seu plano ${PLAN_LIMITS[tier].name} permite ${limit} sessões por mês. Faça um upgrade para continuar.`);
    }

    const cleanedData = {
      ...sessionData,
      patient_id: sessionData.patient_id === "" ? null : sessionData.patient_id,
      psychologist_id: user.id,
    };

    if (!cleanedData.patient_id) throw new Error("Paciente é obrigatório");

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert([cleanedData])
      .select()
      .single();
    
    if (sessionError) throw sessionError;

    if (audioFile) {
      try {
        const uploadResult = await storageService.uploadSessionAudio(
          user.id,
          session.patient_id,
          session.id,
          audioFile
        );

        const { data: updatedSession, error: updateError } = await supabase
          .from('sessions')
          .update({
            audio_file_name: uploadResult.name,
            audio_file_path: uploadResult.path
          })
          .eq('id', session.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updatedSession as Session;
      } catch (error) {
        console.error("Erro no upload do áudio:", error);
        return session as Session;
      }
    }

    return session as Session;
  },

  update: async (id: string, sessionData: Partial<Session>, newAudioFile?: File): Promise<Session> => {
    if (!id) throw new Error("ID da sessão é necessário");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const cleanedData = { ...sessionData };
    if (cleanedData.patient_id === "") delete cleanedData.patient_id;

    delete (cleanedData as any).processing_status;
    delete (cleanedData as any).processing_error;
    delete (cleanedData as any).transcript;
    delete (cleanedData as any).highlights;
    delete (cleanedData as any).next_steps;

    let audioInfo: any = {};
    if (newAudioFile) {
      const currentSession = await sessionService.getById(id);
      if (currentSession?.audio_file_path) {
        try {
          await storageService.deleteFile(currentSession.audio_file_path);
        } catch (e) {
          console.warn("Erro ao excluir áudio antigo:", e);
        }
      }

      const uploadResult = await storageService.uploadSessionAudio(
        user.id,
        cleanedData.patient_id || currentSession!.patient_id,
        id,
        newAudioFile
      );

      audioInfo = {
        audio_file_name: uploadResult.name,
        audio_file_path: uploadResult.path
      };
    }

    const { data, error } = await supabase
      .from('sessions')
      .update({ ...cleanedData, ...audioInfo })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Session;
  },

  processAudio: async (sessionId: string): Promise<any> => {
    const { data, error } = await supabase.functions.invoke('process-session-audio', {
      body: { sessionId }
    });
    
    if (error) throw error;
    return data;
  },

  finishSession: async (id: string): Promise<void> => {
    const session = await sessionService.getById(id);
    if (!session) return;

    if (session.audio_file_path) {
      await supabase
        .from('sessions')
        .update({ processing_status: 'queued' })
        .eq('id', id);

      sessionService.processAudio(id).catch(err => {
        console.error("Erro ao iniciar processamento:", err);
      });
    } else {
      await supabase
        .from('sessions')
        .update({ processing_status: 'completed' })
        .eq('id', id);
    }
  },

  removeAudio: async (sessionId: string): Promise<void> => {
    if (!sessionId) return;
    const session = await sessionService.getById(sessionId);
    if (!session) throw new Error("Sessão não encontrada");

    if (session.audio_file_path) {
      await storageService.deleteFile(session.audio_file_path);
    }

    const { error } = await supabase
      .from('sessions')
      .update({
        audio_file_name: null,
        audio_file_path: null,
        transcript: null,
        highlights: null,
        next_steps: null,
        processing_status: 'draft'
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    if (!id) return;
    const session = await sessionService.getById(id);
    if (session?.audio_file_path) {
      try {
        await storageService.deleteFile(session.audio_file_path);
      } catch (e) {
        console.warn("Erro ao apagar arquivo no storage:", e);
      }
    }

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  getStats: async (): Promise<DashboardStats> => {
    const { data: patientsCount } = await supabase.from('patients').select('id', { count: 'exact' });
    const { data: sessionsCount } = await supabase.from('sessions').select('id', { count: 'exact' });
    const { data: pendingCount } = await supabase.from('sessions').select('id', { count: 'exact' }).in('processing_status', ['queued', 'processing']);
    const { data: completedCount } = await supabase.from('sessions').select('id', { count: 'exact' }).eq('processing_status', 'completed');

    return {
      totalPatients: patientsCount?.length || 0,
      totalSessions: sessionsCount?.length || 0,
      pendingProcessing: pendingCount?.length || 0,
      completedSessions: completedCount?.length || 0
    };
  }
};
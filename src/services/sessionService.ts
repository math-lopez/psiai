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

  checkTranscriptionLimit: async (userId: string, tier: SubscriptionTier): Promise<boolean> => {
    const limit = PLAN_LIMITS[tier].maxTranscriptionsPerMonth;
    if (limit === Infinity) return true;
    if (limit === 0) return false;

    const start = startOfMonth(new Date()).toISOString();
    const end = endOfMonth(new Date()).toISOString();

    const { count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('psychologist_id', userId)
      .not('audio_file_path', 'is', null)
      .in('processing_status', ['completed', 'processing', 'queued'])
      .gte('created_at', start)
      .lte('created_at', end);

    return (count || 0) < limit;
  },

  create: async (sessionData: any, audioFile?: File): Promise<Session> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = (profile?.subscription_tier as SubscriptionTier) || 'free';
    
    // Validar limite de sessões mensais
    const sessionLimit = PLAN_LIMITS[tier].maxSessionsPerMonth;
    const start = startOfMonth(new Date()).toISOString();
    const end = endOfMonth(new Date()).toISOString();

    const { count: sessionCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('psychologist_id', user.id)
      .gte('created_at', start)
      .lte('created_at', end);

    if (sessionCount !== null && sessionCount >= sessionLimit) {
      throw new Error(`Limite de sessões atingido! Seu plano ${PLAN_LIMITS[tier].name} permite ${sessionLimit} sessões/mês.`);
    }

    // Validar limite de transcrição se houver áudio
    if (audioFile) {
      const canTranscribe = await sessionService.checkTranscriptionLimit(user.id, tier);
      if (!canTranscribe) {
        throw new Error(
          tier === 'free' 
            ? "O plano Gratuito não inclui transcrição de áudio. Faça um upgrade para usar este recurso." 
            : `Limite de transcrições mensais atingido (${PLAN_LIMITS[tier].maxTranscriptionsPerMonth}). Faça um upgrade para o plano Profissional.`
        );
      }
    }

    const cleanedData = {
      ...sessionData,
      patient_id: sessionData.patient_id === "" ? null : sessionData.patient_id,
      psychologist_id: user.id,
    };

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert([cleanedData])
      .select()
      .single();
    
    if (sessionError) throw sessionError;

    if (audioFile) {
      const uploadResult = await storageService.uploadSessionAudio(user.id, session.patient_id, session.id, audioFile);
      const { data: updatedSession } = await supabase
        .from('sessions')
        .update({ audio_file_name: uploadResult.name, audio_file_path: uploadResult.path })
        .eq('id', session.id)
        .select()
        .single();
      return updatedSession as Session;
    }

    return session as Session;
  },

  update: async (id: string, sessionData: Partial<Session>, newAudioFile?: File): Promise<Session> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    if (newAudioFile) {
      const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
      const tier = (profile?.subscription_tier as SubscriptionTier) || 'free';
      const canTranscribe = await sessionService.checkTranscriptionLimit(user.id, tier);
      if (!canTranscribe) throw new Error("Limite de transcrições atingido ou não disponível no seu plano.");
    }

    const { data, error } = await supabase
      .from('sessions')
      .update(sessionData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    if (newAudioFile) {
      const uploadResult = await storageService.uploadSessionAudio(user.id, data.patient_id, id, newAudioFile);
      const { data: updated } = await supabase
        .from('sessions')
        .update({ audio_file_name: uploadResult.name, audio_file_path: uploadResult.path })
        .eq('id', id)
        .select()
        .single();
      return updated as Session;
    }

    return data as Session;
  },

  processAudio: async (sessionId: string): Promise<any> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user?.id).single();
    const tier = (profile?.subscription_tier as SubscriptionTier) || 'free';
    
    if (tier === 'free') throw new Error("O plano Gratuito não permite processamento de áudio.");

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
      try {
        await sessionService.processAudio(id);
        await supabase.from('sessions').update({ processing_status: 'queued' }).eq('id', id);
      } catch (e) {
        console.warn("Processamento automático não disponível:", e);
      }
    } else {
      await supabase.from('sessions').update({ processing_status: 'completed' }).eq('id', id);
    }
  },

  removeAudio: async (sessionId: string): Promise<void> => {
    const session = await sessionService.getById(sessionId);
    if (session?.audio_file_path) await storageService.deleteFile(session.audio_file_path);
    await supabase.from('sessions').update({
      audio_file_name: null, audio_file_path: null, transcript: null, highlights: null, next_steps: null, processing_status: 'draft'
    }).eq('id', sessionId);
  },

  delete: async (id: string): Promise<void> => {
    const session = await sessionService.getById(id);
    if (session?.audio_file_path) await storageService.deleteFile(session.audio_file_path);
    await supabase.from('sessions').delete().eq('id', id);
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
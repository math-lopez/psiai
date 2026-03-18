import { supabase } from "@/integrations/supabase/client";
import { Session, DashboardStats } from "@/types";
import { storageService } from "./storageService";

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

    // 1. Criar a sessão primeiro para obter o ID
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert([{ 
        ...sessionData, 
        psychologist_id: user.id,
        processing_status: 'draft'
      }])
      .select()
      .single();
    
    if (sessionError) throw sessionError;

    // 2. Se houver áudio, fazer o upload e atualizar a sessão
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
            audio_file_path: uploadResult.path,
            processing_status: 'queued'
          })
          .eq('id', session.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updatedSession as Session;
      } catch (error) {
        console.error("Erro no upload do áudio, mas sessão foi criada:", error);
        return session as Session;
      }
    }

    return session as Session;
  },

  update: async (id: string, sessionData: Partial<Session>, newAudioFile?: File): Promise<Session> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    // Se houver novo áudio, precisamos lidar com o antigo primeiro
    let audioInfo = {};
    if (newAudioFile) {
      // Buscar sessão atual para ver se já existe áudio
      const currentSession = await sessionService.getById(id);
      if (currentSession?.audio_file_path) {
        try {
          await storageService.deleteFile(currentSession.audio_file_path);
        } catch (e) {
          console.warn("Não foi possível excluir áudio antigo do storage:", e);
        }
      }

      const uploadResult = await storageService.uploadSessionAudio(
        user.id,
        sessionData.patient_id || currentSession!.patient_id,
        id,
        newAudioFile
      );

      audioInfo = {
        audio_file_name: uploadResult.name,
        audio_file_path: uploadResult.path,
        processing_status: 'queued'
      };
    }

    const { data, error } = await supabase
      .from('sessions')
      .update({ ...sessionData, ...audioInfo })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Session;
  },

  removeAudio: async (sessionId: string): Promise<void> => {
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
        processing_status: 'draft'
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    // Buscar sessão para apagar áudio do storage se existir
    const session = await sessionService.getById(id);
    if (session?.audio_file_path) {
      try {
        await storageService.deleteFile(session.audio_file_path);
      } catch (e) {
        console.warn("Erro ao apagar arquivo no storage durante exclusão da sessão:", e);
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
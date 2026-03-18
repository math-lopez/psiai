import { supabase } from "@/integrations/supabase/client";
import { Session, DashboardStats } from "@/types";

export const sessionService = {
  list: async (): Promise<Session[]> => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, patient:patients(full_name)')
      .order('session_date', { ascending: false });
    
    if (error) throw error;
    return data.map(s => ({
      ...s,
      patientName: s.patient?.full_name || 'Desconhecido'
    })) as Session[];
  },

  getById: async (id: string): Promise<Session | null> => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, patient:patients(full_name)')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return {
      ...data,
      patientName: data.patient?.full_name || 'Desconhecido'
    } as Session;
  },

  create: async (session: any, audioFile?: File): Promise<Session> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    let audioPath = null;
    let audioName = null;

    if (audioFile) {
      audioName = audioFile.name;
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${session.patient_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('session-audios')
        .upload(filePath, audioFile);

      if (uploadError) throw uploadError;
      audioPath = filePath;
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert([{ 
        ...session, 
        psychologist_id: user.id,
        audio_file_name: audioName,
        audio_file_path: audioPath,
        processing_status: audioFile ? 'queued' : 'draft'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Session;
  },

  // PREPARAÇÃO PARA AUTOMAÇÃO: Função que dispara o processamento
  processSession: async (sessionId: string): Promise<void> => {
    // 1. Atualiza status localmente para 'queued'
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ processing_status: 'queued' })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // 2. Placeholder para chamada da Edge Function
    // Futuramente: const { data, error } = await supabase.functions.invoke('process-audio', { body: { sessionId } });
    console.log(`[PsiAI] Disparando processamento para sessão: ${sessionId}`);
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
  },

  getAudioUrl: (path: string) => {
    const { data } = supabase.storage.from('session-audios').getPublicUrl(path);
    return data.publicUrl;
  }
};
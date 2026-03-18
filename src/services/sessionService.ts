import { supabase } from "@/integrations/supabase/client";
import { Session, DashboardStats } from "@/types";

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

  processSession: async (sessionId: string): Promise<void> => {
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ processing_status: 'queued' })
      .eq('id', sessionId);

    if (updateError) throw updateError;
    console.log(`[PsiAI] Disparando processamento para sessão: ${sessionId}`);
  },

  getStats: async (): Promise<DashboardStats> => {
    const [
      { count: totalPatients },
      { count: totalSessions },
      { count: pendingProcessing },
      { count: completedSessions }
    ] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }).in('processing_status', ['queued', 'processing']),
      supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('processing_status', 'completed')
    ]);

    return {
      totalPatients: totalPatients || 0,
      totalSessions: totalSessions || 0,
      pendingProcessing: pendingProcessing || 0,
      completedSessions: completedSessions || 0
    };
  },

  getAudioUrl: (path: string) => {
    const { data } = supabase.storage.from('session-audios').getPublicUrl(path);
    return data.publicUrl;
  }
};
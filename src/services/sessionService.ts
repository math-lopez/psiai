"use client";

import { supabase } from "@/integrations/supabase/client";
import { Session, DashboardStats } from "@/types";
import { storageService } from "./storageService";
import { PLAN_LIMITS, SubscriptionTier } from "@/config/plans";
import { startOfMonth, endOfMonth, addWeeks, isBefore, parseISO } from "date-fns";

export const sessionService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const [patientsRes, sessionsRes] = await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id, processing_status', { count: 'exact' })
    ]);

    const sessions = sessionsRes.data || [];
    
    return {
      totalPatients: patientsRes.count || 0,
      totalSessions: sessions.length,
      pendingProcessing: sessions.filter(s => s.processing_status === 'processing' || s.processing_status === 'queued').length,
      completedSessions: sessions.filter(s => s.processing_status === 'completed').length,
    };
  },

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

    const { data, error } = await supabase
      .from('sessions')
      .insert([{ ...session, psychologist_id: user.id, processing_status: 'draft' }])
      .select()
      .single();
    
    if (error) throw error;

    if (audioFile && data) {
      const upload = await storageService.uploadSessionAudio(user.id, data.patient_id, data.id, audioFile);
      const { data: updated } = await supabase
        .from('sessions')
        .update({ 
          audio_file_name: upload.name, 
          audio_file_path: upload.path 
        })
        .eq('id', data.id)
        .select()
        .single();
      return updated as Session;
    }

    return data as Session;
  },

  createRecurrent: async (baseSession: any, untilDate: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const sessionsToInsert = [];
    let currentDate = parseISO(baseSession.session_date);
    const limitDate = parseISO(untilDate);

    sessionsToInsert.push({ ...baseSession, psychologist_id: user.id, processing_status: 'draft' });

    while (true) {
      currentDate = addWeeks(currentDate, 1);
      if (isBefore(limitDate, currentDate)) break;
      
      sessionsToInsert.push({
        ...baseSession,
        session_date: currentDate.toISOString(),
        psychologist_id: user.id,
        processing_status: 'draft'
      });
    }

    const { error } = await supabase
      .from('sessions')
      .insert(sessionsToInsert);
    
    if (error) throw error;
  },

  update: async (id: string, session: any, audioFile?: File): Promise<Session> => {
    const { data, error } = await supabase
      .from('sessions')
      .update(session)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Session;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) throw error;
  },

  finishSession: async (id: string): Promise<void> => {
    // Ao finalizar, definimos o status como concluído. 
    // Se for manual, o processing_status também vira completed (pois não há IA para rodar).
    const { data: session } = await supabase.from('sessions').select('record_type, audio_file_path').eq('id', id).single();
    
    const updates: any = { status: 'completed' };
    
    if (!session?.audio_file_path || session?.record_type === 'manual') {
      updates.processing_status = 'completed';
    }

    const { error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  cancelSession: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'cancelled', processing_status: 'cancelled' })
      .eq('id', id);
    if (error) throw error;
  },

  processAudio: async (sessionId: string): Promise<void> => {
    await supabase.functions.invoke('process-session-audio', { body: { sessionId } });
  },

  getSessionAIAnalysis: async (sessionId: string) => {
    const { data } = await supabase.from('session_ai_analysis').select('*').eq('session_id', sessionId).maybeSingle();
    return data;
  }
};
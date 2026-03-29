"use client";

import { supabase } from "@/integrations/supabase/client";
import { Session, DashboardStats } from "@/types";
import { storageService } from "./storageService";
import { PLAN_LIMITS, SubscriptionTier } from "@/config/plans";
import { startOfMonth, endOfMonth } from "date-fns";

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

  // Busca a análise profunda de IA da sessão
  getSessionAIAnalysis: async (sessionId: string) => {
    const { data, error } = await supabase
      .from('session_ai_analysis')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  // Solicita a geração da análise profunda via Edge Function
  analyzeSessionAI: async (sessionId: string) => {
    const { data, error } = await supabase.functions.invoke('analyze-session-v2', {
      body: { sessionId }
    });
    
    if (error) throw error;
    return data;
  },

  create: async (session: any, audioFile?: File): Promise<Session> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    // 1. Verificar plano e limites de sessões no mês
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = (profile?.subscription_tier as SubscriptionTier) || 'free';
    const limit = PLAN_LIMITS[tier].maxSessionsPerMonth;

    if (limit !== Infinity) {
      const start = startOfMonth(new Date()).toISOString();
      const end = endOfMonth(new Date()).toISOString();

      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('psychologist_id', user.id)
        .gte('session_date', start)
        .lte('session_date', end);

      if (count !== null && count >= limit) {
        throw new Error(`Limite de sessões atingido! Seu plano ${PLAN_LIMITS[tier].name} permite apenas ${limit} sessões por mês. Faça um upgrade para continuar.`);
      }
    }

    // 2. Criar a sessão
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

  update: async (id: string, session: any, audioFile?: File): Promise<Session> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    let updateData = { ...session };

    if (audioFile) {
      const upload = await storageService.uploadSessionAudio(user.id, session.patient_id, id, audioFile);
      updateData.audio_file_name = upload.name;
      updateData.audio_file_path = upload.path;
    }

    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Session;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  finishSession: async (id: string): Promise<void> => {
    const { data: session } = await supabase.from('sessions').select('*').eq('id', id).single();
    
    const nextStatus = (session?.audio_file_path && session?.processing_status === 'draft') ? 'queued' : 'completed';

    const { error } = await supabase
      .from('sessions')
      .update({ processing_status: nextStatus })
      .eq('id', id);
    
    if (error) throw error;

    if (nextStatus === 'queued') {
      sessionService.processAudio(id);
    }
  },

  processAudio: async (sessionId: string): Promise<void> => {
    const { error } = await supabase.functions.invoke('process-session-audio', {
      body: { sessionId }
    });
    
    if (error) throw error;
  }
};
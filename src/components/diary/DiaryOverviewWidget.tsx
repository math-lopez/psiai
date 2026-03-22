"use client";

import React, { useState, useEffect } from "react";
import { PatientLog, PatientLogPrompt } from "@/types/diary";
import { diaryService } from "@/services/diaryService";
import { BookOpen, ClipboardCheck, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DiaryOverviewWidgetProps {
  patientId: string;
  onViewMore: () => void;
}

export const DiaryOverviewWidget = ({ patientId, onViewMore }: DiaryOverviewWidgetProps) => {
  const [logs, setLogs] = useState<PatientLog[]>([]);
  const [prompts, setPrompts] = useState<PatientLogPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [l, p] = await Promise.all([
          diaryService.listLogs(patientId),
          diaryService.listPrompts(patientId)
        ]);
        setLogs(l.slice(0, 2));
        setPrompts(p.filter(pr => pr.status === 'active').slice(0, 2));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  if (loading) return null;
  if (logs.length === 0 && prompts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2 flex items-center justify-between">
          <span>Últimos Registros</span>
          <button onClick={onViewMore} className="text-[9px] text-primary hover:underline">Ver tudo</button>
        </h3>
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-100 transition-colors">
              <p className="text-sm font-bold text-slate-800 line-clamp-1">{log.title || 'Registro do Diário'}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3 text-slate-300" />
                <span className="text-[10px] font-bold text-slate-400">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2 flex items-center justify-between">
          <span>Prompts Ativos</span>
          <button onClick={onViewMore} className="text-[9px] text-primary hover:underline">Ver tudo</button>
        </h3>
        <div className="space-y-3">
          {prompts.map(prompt => (
            <div key={prompt.id} className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl shadow-sm flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{prompt.title}</p>
                <p className="text-[10px] font-medium text-amber-600">Aguardando registro</p>
              </div>
              <ClipboardCheck className="h-4 w-4 text-amber-500 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
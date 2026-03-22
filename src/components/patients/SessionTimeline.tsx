"use client";

import React, { useState } from "react";
import { Session } from "@/types";
import { 
  Clock, CheckCircle2, AlertCircle, FileText, 
  Mic, Sparkles, ChevronDown, ChevronUp, History, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SessionTimelineProps {
  sessions: Session[];
}

const TimelineItem = ({ session }: { session: Session }) => {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    completed: { icon: CheckCircle2, label: "Processado", class: "bg-emerald-100 text-emerald-700" },
    processing: { icon: Clock, label: "Processando", class: "bg-blue-100 text-blue-700" },
    queued: { icon: Clock, label: "Na Fila", class: "bg-amber-100 text-amber-700" },
    error: { icon: AlertCircle, label: "Erro", class: "bg-red-100 text-red-700" },
    draft: { icon: FileText, label: "Rascunho", class: "bg-slate-100 text-slate-700" },
  };

  const status = statusConfig[session.processing_status] || statusConfig.draft;
  const transcriptPreview = session.transcript ? session.transcript.substring(0, 200) + "..." : "Sem transcrição disponível.";

  return (
    <div className="relative pl-10 pb-12 group last:pb-0">
      {/* Linha da Timeline */}
      <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-slate-100 group-last:bg-transparent" />
      
      {/* Círculo do Status */}
      <div className={cn(
        "absolute left-0 top-0 h-10 w-10 rounded-2xl border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110",
        session.processing_status === 'completed' ? 'bg-emerald-500' : 
        session.processing_status === 'error' ? 'bg-red-500' : 'bg-slate-300'
      )}>
        {session.record_type === 'manual' ? <FileText className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4 text-white" />}
      </div>

      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-slate-900">
              {format(new Date(session.session_date), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <Badge className={cn("border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", status.class)}>
                {status.label}
              </Badge>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{session.duration_minutes} min</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            className="rounded-xl gap-2 font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? "Recolher" : "Ver detalhes"}
          </Button>
        </div>

        <div className={cn(
          "bg-white border border-slate-100 rounded-3xl p-6 transition-all duration-300",
          expanded ? "shadow-xl border-indigo-100 ring-1 ring-indigo-50" : "shadow-sm hover:border-slate-200"
        )}>
          {!expanded ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 italic line-clamp-2">
                {session.manual_notes || "Nenhuma nota inserida."}
              </p>
              {session.highlights && session.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {session.highlights.slice(0, 3).map((h, i) => (
                    <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg truncate max-w-[150px]">
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <FileText className="h-3 w-3" /> Notas Manuais
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {session.manual_notes || "Sem notas."}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                    <Sparkles className="h-3 w-3" /> Transcrição Inteligente
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                    {session.transcript || "Transcrição não disponível."}
                  </p>
                </div>
              </div>

              <div className="space-y-6 bg-slate-50/50 p-4 rounded-2xl">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                    <Info className="h-3 w-3" /> Destaques (Highlights)
                  </h4>
                  <ul className="space-y-2">
                    {session.highlights && session.highlights.length > 0 ? (
                      session.highlights.map((h, i) => (
                        <li key={i} className="text-xs text-slate-700 flex gap-2 font-medium">
                          <div className="h-1 w-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          {h}
                        </li>
                      ))
                    ) : <li className="text-xs text-slate-400 italic">Sem destaques processados.</li>}
                  </ul>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" /> Próximos Passos
                  </h4>
                  <p className="text-xs text-slate-700 font-medium">
                    {session.next_steps || "Sem sugestões definidas."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SessionTimeline = ({ sessions }: SessionTimelineProps) => {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[32px] border-none shadow-sm">
        <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
        <h3 className="text-slate-900 font-bold">Nenhuma sessão encontrada</h3>
        <p className="text-slate-400 text-sm mt-1">Este paciente ainda não possui atendimentos registrados.</p>
      </div>
    );
  }

  // Ordena por data decrescente (mais recente primeiro)
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 mb-8">
        <h3 className="text-xl font-black text-slate-900">Timeline Terapêutica</h3>
        <Badge variant="outline" className="border-slate-200 text-slate-500 font-bold">
          {sessions.length} atendimentos
        </Badge>
      </div>
      <div className="relative">
        {sortedSessions.map((session) => (
          <TimelineItem key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
};

import { ArrowRight } from "lucide-react";
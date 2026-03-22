"use client";

import React, { useState } from "react";
import { Session } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  StickyNote,
  Footprints,
  Quote,
  ClipboardList
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SessionTimelineItemProps {
  session: Session;
}

export const SessionTimelineItem = ({ session }: SessionTimelineItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
      case 'queued':
        return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none gap-1 font-bold text-[10px]"><Loader2 className="h-3 w-3 animate-spin" /> Processando</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none gap-1 font-bold text-[10px]"><CheckCircle2 className="h-3 w-3" /> Processado</Badge>;
      case 'error':
        return <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-none gap-1 font-bold text-[10px]"><AlertCircle className="h-3 w-3" /> Erro</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-600 hover:bg-slate-50 border-none font-bold text-[10px]">Rascunho</Badge>;
    }
  };

  const transcriptPreview = session.transcript 
    ? session.transcript.slice(0, 200) + (session.transcript.length > 200 ? "..." : "")
    : "Sem transcrição disponível.";

  return (
    <div className="relative pl-8 pb-10 group last:pb-0">
      <div className="absolute left-[11px] top-2 bottom-0 w-[2px] bg-slate-100 group-last:bg-transparent" />
      <div className={cn(
        "absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-110",
        session.processing_status === 'completed' ? "bg-emerald-500" : "bg-slate-300"
      )}>
        <div className="h-1.5 w-1.5 rounded-full bg-white" />
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-slate-900">
              {format(new Date(session.session_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Clock className="h-3 w-3" /> {session.duration_minutes} min
            </span>
          </div>
          {getStatusBadge(session.processing_status)}
        </div>

        <div className="space-y-5">
          {/* Seção de Resumo Manual (Fase 2) */}
          {session.session_summary_manual && (
            <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-50">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase text-emerald-600 tracking-wider mb-2">
                <Quote className="h-3 w-3" /> Síntese da Sessão
              </div>
              <p className="text-xs font-bold text-slate-700 italic leading-relaxed">
                "{session.session_summary_manual.slice(0, 250)}{session.session_summary_manual.length > 250 ? '...' : ''}"
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-400 tracking-wider">
              <FileText className="h-3 w-3" /> Transcrição
            </div>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {isExpanded ? (session.transcript || "Sem transcrição disponível.") : transcriptPreview}
            </p>
          </div>

          {isExpanded && (
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-500 tracking-wider">
                  <ClipboardList className="h-3 w-3" /> Notas Clínicas
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {session.clinical_notes || "Não preenchido."}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                  <Quote className="h-3 w-3" /> Intervenções
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {session.interventions || "Não preenchido."}
                </p>
              </div>

              <div className="md:col-span-2 pt-4 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500 tracking-wider">
                    <Sparkles className="h-3 w-3" /> IA: Destaques
                  </div>
                  {session.highlights && session.highlights.length > 0 ? (
                    <ul className="space-y-2">
                      {session.highlights.map((h, i) => (
                        <li key={i} className="text-xs text-slate-700 flex gap-2">
                          <span className="h-1 w-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-xs text-slate-400 italic">Sem destaques.</p>}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-500 tracking-wider">
                    <Footprints className="h-3 w-3" /> IA: Próximos Passos
                  </div>
                  <p className="text-xs text-slate-700">{session.next_steps || "Sem sugestões."}</p>
                </div>
              </div>
            </div>
          )}

          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="w-full mt-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-2xl gap-2 h-10 text-xs font-bold">
            {isExpanded ? <>Recolher Registro <ChevronUp className="h-4 w-4" /></> : <>Ver Prontuário Completo <ChevronDown className="h-4 w-4" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
};
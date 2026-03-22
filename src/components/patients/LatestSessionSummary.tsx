"use client";

import React from "react";
import { Session } from "@/types";
import { Sparkles, FileText, ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LatestSessionSummaryProps {
  session: Session;
}

export const LatestSessionSummary = ({ session }: LatestSessionSummaryProps) => {
  const statusConfig = {
    completed: { icon: CheckCircle2, label: "Processado", class: "bg-emerald-100 text-emerald-700" },
    processing: { icon: Clock, label: "Processando", class: "bg-blue-100 text-blue-700" },
    queued: { icon: Clock, label: "Na Fila", class: "bg-amber-100 text-amber-700" },
    error: { icon: AlertCircle, label: "Erro", class: "bg-red-100 text-red-700" },
    draft: { icon: FileText, label: "Rascunho", class: "bg-slate-100 text-slate-700" },
  };

  const status = statusConfig[session.processing_status] || statusConfig.draft;

  return (
    <Card className="border-none shadow-md bg-white rounded-[32px] overflow-hidden mb-8">
      <div className="bg-indigo-600 px-8 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-black uppercase tracking-widest">Última Sessão</span>
        </div>
        <span className="text-sm font-bold opacity-80">
          {format(new Date(session.session_date), "dd 'de' MMMM", { locale: ptBR })}
        </span>
      </div>
      
      <CardContent className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className={cn("border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest", status.class)}>
              <status.icon className="h-3 w-3 mr-1.5" /> {status.label}
            </Badge>
            <span className="text-slate-400 text-xs font-bold">{session.duration_minutes} minutos de sessão</span>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" /> Resumo Clínico
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 italic">
              {session.manual_notes || "Sem notas manuais registradas para este atendimento."}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" /> Principais Destaques
          </h4>
          <div className="space-y-2">
            {session.highlights && session.highlights.length > 0 ? (
              session.highlights.slice(0, 3).map((h, i) => (
                <div key={i} className="flex gap-3 text-sm text-slate-700 font-medium">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                  {h}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">Destaques automáticos não disponíveis ou em processamento.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
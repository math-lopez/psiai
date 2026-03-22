"use client";

import React from "react";
import { Session } from "@/types";
import { SessionTimelineItem } from "./SessionTimelineItem";
import { CalendarDays } from "lucide-react";

interface PatientTimelineProps {
  sessions: Session[];
}

export const PatientTimeline = ({ sessions }: PatientTimelineProps) => {
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
  );

  if (sessions.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
        <CalendarDays className="h-12 w-12 text-slate-200 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Histórico vazio</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          Este paciente ainda não possui sessões registradas no sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xl font-black text-slate-900 mb-8 px-2 flex items-center gap-3">
        Linha do Tempo <span className="text-sm font-bold text-slate-300 bg-slate-50 px-3 py-1 rounded-full">{sessions.length}</span>
      </h3>
      <div className="max-w-4xl">
        {sortedSessions.map((session) => (
          <SessionTimelineItem key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
};
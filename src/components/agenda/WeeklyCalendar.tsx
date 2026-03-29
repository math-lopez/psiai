"use client";

import React from "react";
import { format, startOfWeek, addDays, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Session } from "@/types";
import { cn } from "@/lib/utils";
import { Clock, Video, User } from "lucide-react";

interface WeeklyCalendarProps {
  currentDate: Date;
  sessions: Session[];
  onSessionClick: (session: Session) => void;
  onEmptySlotClick: (date: Date, hour: number) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 às 21:00

export const WeeklyCalendar = ({ currentDate, sessions, onSessionClick, onEmptySlotClick }: WeeklyCalendarProps) => {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      {/* Header com os dias da semana */}
      <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50/50">
        <div className="p-4 border-r border-slate-100"></div>
        {weekDays.map((day) => (
          <div key={day.toString()} className={cn(
            "p-4 text-center border-r border-slate-100 last:border-r-0",
            isSameDay(day, new Date()) && "bg-indigo-50/50"
          )}>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
              {format(day, "EEE", { locale: ptBR })}
            </p>
            <p className={cn(
              "text-lg font-black",
              isSameDay(day, new Date()) ? "text-indigo-600" : "text-slate-900"
            )}>
              {format(day, "dd")}
            </p>
          </div>
        ))}
      </div>

      {/* Grid de horários */}
      <div className="flex-1 overflow-y-auto max-h-[600px] no-scrollbar">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-slate-50 last:border-b-0 group">
            <div className="p-4 text-[10px] font-bold text-slate-400 text-right border-r border-slate-100 bg-slate-50/20">
              {hour.toString().padStart(2, '0')}:00
            </div>
            
            {weekDays.map((day) => {
              const daySessions = sessions.filter(s => {
                const sDate = new Date(s.session_date);
                return isSameDay(sDate, day) && sDate.getHours() === hour;
              });

              return (
                <div 
                  key={day.toString() + hour} 
                  className="relative border-r border-slate-50 last:border-r-0 min-h-[80px] hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => onEmptySlotClick(day, hour)}
                >
                  {daySessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionClick(session);
                      }}
                      className={cn(
                        "absolute inset-1 p-2 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02] z-10",
                        session.status === 'scheduled' ? "bg-indigo-600 text-white" :
                        session.status === 'cancelled' ? "bg-slate-100 text-slate-400 line-through" :
                        "bg-emerald-500 text-white"
                      )}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <p className="truncate text-[11px]">{session.patient?.full_name}</p>
                        <div className="flex items-center justify-between gap-1 opacity-80">
                           <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-[9px]">{session.duration_minutes}m</span>
                           </div>
                           {session.meeting_link && <Video className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
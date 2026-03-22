"use client";

import React, { useState } from "react";
import { PatientLog, LogType } from "@/types/diary";
import { 
  FileText, 
  Calendar, 
  Smile, 
  User, 
  MoreVertical, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Edit,
  Eye,
  EyeOff,
  Paperclip,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LogItemProps {
  log: PatientLog;
  onEdit: (log: PatientLog) => void;
  onDelete: (id: string) => void;
}

const logTypeConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  weekly_journal: { label: 'Diário da Semana', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
  emotional_record: { label: 'Registro Emocional', icon: Smile, color: 'text-pink-600', bg: 'bg-pink-50' },
  thought_record: { label: 'Registro de Pensamentos', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  homework: { label: 'Tarefa Terapêutica', icon: Paperclip, color: 'text-amber-600', bg: 'bg-amber-50' },
  free_entry: { label: 'Anotação Livre', icon: User, color: 'text-slate-600', bg: 'bg-slate-100' },
  unknown: { label: 'Registro', icon: HelpCircle, color: 'text-slate-400', bg: 'bg-slate-50' },
};

export const LogItem = ({ log, onEdit, onDelete }: LogItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Fallback seguro caso o tipo vindo do banco não esteja mapeado
  const config = logTypeConfig[log.log_type] || logTypeConfig.unknown;
  const Icon = config.icon;

  return (
    <div className="group bg-white border border-slate-100 rounded-[32px] p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", config.bg, config.color)}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 leading-none mb-1">{log.title || config.label}</h4>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {log.created_at ? format(new Date(log.created_at), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                {log.created_by === 'psychologist' ? 'Registrado por você' : 'Registrado pelo paciente'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {log.visibility === 'private_to_psychologist' ? (
            <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400" title="Privado: Apenas o psicólogo vê">
              <EyeOff className="h-3.5 w-3.5" />
            </div>
          ) : (
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-500" title="Compartilhado: Visível para o paciente no futuro portal">
              <Eye className="h-3.5 w-3.5" />
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreVertical className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl">
              <DropdownMenuItem onClick={() => onEdit(log)} className="font-bold gap-2">
                <Edit className="h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(log.id)} className="text-red-600 font-bold gap-2">
                <Trash2 className="h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative">
        <p className={cn(
          "text-sm text-slate-600 leading-relaxed whitespace-pre-wrap",
          !isExpanded && "line-clamp-3"
        )}>
          {log.content}
        </p>
        
        {log.content && log.content.length > 200 && (
          <Button 
            variant="link" 
            className="p-0 h-auto text-[10px] font-black uppercase text-indigo-500 mt-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Ver menos" : "Ver registro completo"}
          </Button>
        )}
      </div>

      {log.mood && (
        <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl w-fit">
          <span className="text-sm">{log.mood}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Humor registrado</span>
        </div>
      )}
    </div>
  );
};
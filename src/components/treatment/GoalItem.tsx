import React from "react";
import { TreatmentGoal, GoalStatus } from "@/types/treatment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  PauseCircle, 
  XCircle, 
  MoreVertical,
  Calendar,
  AlertCircle
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface GoalItemProps {
  goal: TreatmentGoal;
  onUpdateStatus: (id: string, status: GoalStatus) => void;
  onEdit: (goal: TreatmentGoal) => void;
  onDelete: (id: string) => void;
}

const statusConfig: Record<GoalStatus, { label: string; icon: any; color: string; bg: string }> = {
  not_started: { label: 'Não iniciado', icon: Circle, color: 'text-slate-400', bg: 'bg-slate-50' },
  in_progress: { label: 'Em progresso', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
  completed: { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  paused: { label: 'Pausado', icon: PauseCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-red-400', bg: 'bg-red-50' },
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Média', color: 'bg-indigo-100 text-indigo-600' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-600' },
};

export const GoalItem = ({ goal, onUpdateStatus, onEdit, onDelete }: GoalItemProps) => {
  const config = statusConfig[goal.status];
  const StatusIcon = config.icon;

  return (
    <div className="group relative flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-[24px] hover:shadow-md hover:border-indigo-100 transition-all">
      <button 
        onClick={() => onUpdateStatus(goal.id, goal.status === 'completed' ? 'in_progress' : 'completed')}
        className={cn(
          "mt-1 flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
          goal.status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 text-transparent hover:border-indigo-300 hover:text-indigo-200"
        )}
      >
        <CheckCircle2 className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className={cn(
            "text-sm font-bold truncate transition-all",
            goal.status === 'completed' ? "text-slate-400 line-through" : "text-slate-900"
          )}>
            {goal.title}
          </h4>
          <div className="flex items-center gap-2">
             <Badge className={cn("text-[8px] font-black uppercase tracking-widest border-none px-2", priorityConfig[goal.priority].color)}>
              {priorityConfig[goal.priority].label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreVertical className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl border-slate-100">
                <DropdownMenuItem onClick={() => onEdit(goal)} className="font-bold text-xs">Editar Objetivo</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUpdateStatus(goal.id, 'in_progress')} className="text-xs">Marcar "Em Progresso"</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(goal.id, 'paused')} className="text-xs">Marcar "Pausado"</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(goal.id, 'cancelled')} className="text-xs text-red-500">Cancelar Objetivo</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(goal.id)} className="text-red-600 focus:text-red-600 font-bold text-xs">Excluir Permanente</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {goal.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {goal.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest", config.bg, config.color)}>
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </div>
          
          {goal.target_date && (
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
              <Calendar className="h-3 w-3" />
              Até {format(new Date(goal.target_date), 'dd/MM/yy')}
            </div>
          )}

          {goal.notes && (
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-400">
              <AlertCircle className="h-3 w-3" />
              Possui observações
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
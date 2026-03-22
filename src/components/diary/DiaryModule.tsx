"use client";

import React, { useState, useEffect } from "react";
import { PatientLog, PatientLogPrompt, LogType, PromptType } from "@/types/diary";
import { diaryService } from "@/services/diaryService";
import { 
  BookOpen, 
  Plus, 
  Loader2, 
  Filter, 
  Search, 
  ClipboardCheck, 
  LayoutGrid,
  History,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogItem } from "./LogItem";
import { LogForm } from "./LogForm";
import { PromptForm } from "./PromptForm";
import { showError, showSuccess } from "@/utils/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DiaryModuleProps {
  patientId: string;
}

export const DiaryModule = ({ patientId }: DiaryModuleProps) => {
  const [logs, setLogs] = useState<PatientLog[]>([]);
  const [prompts, setPrompts] = useState<PatientLogPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<LogType | 'all'>('all');

  // Modais
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [isPromptFormOpen, setIsPromptFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<PatientLog | null>(null);

  const fetchData = async () => {
    try {
      const [l, p] = await Promise.all([
        diaryService.listLogs(patientId),
        diaryService.listPrompts(patientId)
      ]);
      setLogs(l);
      setPrompts(p);
    } catch (e) {
      showError("Erro ao carregar diário.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      await diaryService.deleteLog(id);
      showSuccess("Registro excluído.");
      fetchData();
    } catch (e) {
      showError("Erro ao excluir.");
    }
  };

  const handleUpdatePromptStatus = async (id: string, status: any) => {
    try {
      await diaryService.updatePrompt(id, { status });
      showSuccess("Tarefa atualizada.");
      fetchData();
    } catch (e) {
      showError("Erro ao atualizar tarefa.");
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || log.log_type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const activePrompts = prompts.filter(p => p.status === 'active');

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Lado Esquerdo: Registros */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Diário do Paciente</h3>
            </div>
            <Button 
              onClick={() => { setEditingLog(null); setIsLogFormOpen(true); }}
              className="bg-primary hover:bg-primary/90 rounded-2xl h-12 px-6 shadow-xl shadow-primary/20 gap-2 font-black"
            >
              <Plus className="h-5 w-5" /> Novo Registro
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar no diário..." 
                className="pl-10 h-11 rounded-2xl border-slate-100 bg-slate-50/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {(['all', 'weekly_journal', 'emotional_record', 'thought_record', 'homework'] as const).map((f) => (
                <Button
                  key={f}
                  variant={activeFilter === f ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    "rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest",
                    activeFilter === f ? "bg-indigo-50 text-indigo-600" : "text-slate-500"
                  )}
                  onClick={() => setActiveFilter(f)}
                >
                  {f === 'all' ? 'Tudo' : 
                   f === 'weekly_journal' ? 'Semanal' : 
                   f === 'emotional_record' ? 'Emoção' : 
                   f === 'thought_record' ? 'Pensamento' : 'Tarefa'}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <LogItem 
                  key={log.id} 
                  log={log} 
                  onEdit={(l) => { setEditingLog(l); setIsLogFormOpen(true); }}
                  onDelete={handleDeleteLog}
                />
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
                <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Nenhum registro encontrado.</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Tarefas e Acompanhamento */}
        <div className="w-full md:w-80 space-y-6">
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
            <div className="h-1.5 w-full bg-amber-500" />
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" /> Tarefas Ativas
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full text-amber-600 hover:bg-amber-50"
                onClick={() => setIsPromptFormOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {activePrompts.length > 0 ? (
                activePrompts.map(prompt => (
                  <div key={prompt.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-amber-200 transition-all group">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-bold text-slate-800 leading-tight">{prompt.title}</p>
                      <button 
                        onClick={() => handleUpdatePromptStatus(prompt.id, 'completed')}
                        className="h-5 w-5 rounded-full border-2 border-slate-200 flex items-center justify-center text-transparent hover:border-emerald-500 hover:text-emerald-500 transition-all"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {prompt.description && (
                      <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{prompt.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge className="bg-white text-[8px] font-black uppercase border-none px-2 py-0.5">
                        {prompt.prompt_type === 'homework' ? 'Tarefa' : 'Diário'}
                      </Badge>
                      {prompt.due_date && (
                        <span className="text-[9px] font-bold text-amber-600">
                          Até {format(new Date(prompt.due_date), 'dd/MM')}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-slate-50/30 rounded-2xl border border-dashed border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sem tarefas pendentes</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[32px] bg-indigo-600 text-white overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-white">Próximo Passo</h4>
                <p className="text-xs text-indigo-100 leading-relaxed mt-1">
                  Use os registros entre sessões para identificar padrões de pensamento e comportamentos recorrentes na rotina do paciente.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modais */}
      <LogForm 
        isOpen={isLogFormOpen} 
        onClose={() => { setIsLogFormOpen(false); setEditingLog(null); }}
        onSuccess={fetchData}
        patientId={patientId}
        editingLog={editingLog}
      />

      <PromptForm
        isOpen={isPromptFormOpen}
        onClose={() => setIsPromptFormOpen(false)}
        onSuccess={fetchData}
        patientId={patientId}
      />
    </div>
  );
};
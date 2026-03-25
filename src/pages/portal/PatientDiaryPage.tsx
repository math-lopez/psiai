"use client";

import React, { useState, useEffect } from "react";
import { PatientLog, PatientLogPrompt, LogType } from "@/types/diary";
import { diaryService } from "@/services/diaryService";
import { 
  BookOpen, 
  Plus, 
  Loader2, 
  History, 
  ClipboardCheck,
  Calendar,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PatientLogForm } from "@/components/diary/PatientLogForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const PatientDiaryPage = () => {
  const [logs, setLogs] = useState<PatientLog[]>([]);
  const [prompts, setPrompts] = useState<PatientLogPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<{ patientId: string; psychologistId: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<LogType | 'all'>('all');

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const ctx = await diaryService.getPatientContext();
      if (!ctx) {
        showError("Não foi possível identificar seu vínculo clínico.");
        return;
      }
      setContext(ctx);

      const [l, p] = await Promise.all([
        diaryService.listLogs(ctx.patientId),
        diaryService.listPrompts(ctx.patientId)
      ]);
      setLogs(l);
      setPrompts(p);
    } catch (e) {
      showError("Erro ao carregar dados do diário.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || log.log_type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  const activePrompts = prompts.filter(p => p.status === 'active');
  const completedPrompts = prompts.filter(p => p.status === 'completed');

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Meu Diário</h1>
        <Button 
          onClick={() => { setActivePromptId(null); setIsFormOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-12 px-6 shadow-xl shadow-indigo-100 gap-2 font-black"
        >
          <Plus className="h-5 w-5" /> Novo Registro
        </Button>
      </div>

      {/* Seção de Tarefas */}
      {(activePrompts.length > 0 || completedPrompts.length > 0) && (
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 px-2 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" /> Tarefas e Propostas
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {activePrompts.map((p) => (
              <Card key={p.id} className="border-none shadow-md rounded-[32px] overflow-hidden bg-amber-50/50 border-amber-100 border">
                <CardContent className="p-6 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>
                  </div>
                  <Button 
                    onClick={() => { setActivePromptId(p.id); setIsFormOpen(true); }}
                    className="bg-amber-500 hover:bg-amber-600 rounded-xl h-10 px-4 font-black shrink-0"
                  >
                    Responder
                  </Button>
                </CardContent>
              </Card>
            ))}

            {completedPrompts.length > 0 && (
              <div className="pt-2">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 p-2 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <span>Tarefas Concluídas ({completedPrompts.length})</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showHistory && "rotate-180")} />
                </button>
                
                {showHistory && (
                  <div className="mt-3 space-y-3 animate-in slide-in-from-top-1">
                    {completedPrompts.map(p => (
                      <div key={p.id} className="p-5 bg-white border border-slate-50 rounded-[24px] flex items-center justify-between gap-4 opacity-70">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-600 truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-400">Finalizada em {format(new Date(p.updated_at), 'dd/MM/yy')}</p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Seção de Registros com Filtros */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <History className="h-4 w-4" /> Histórico de Registros
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar no seu diário..." 
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
        
        <div className="space-y-4">
          {filteredLogs.length > 0 ? filteredLogs.map((log) => (
            <div key={log.id} className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-4">
                  {log.mood ? (
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl">
                      {log.mood}
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 leading-none mb-1">{log.title || "Anotação do Diário"}</h4>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {format(new Date(log.created_at), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                {log.created_by === 'psychologist' && (
                  <div className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-black uppercase tracking-widest">
                    Postado pelo Psicólogo
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{log.content}</p>
            </div>
          )) : (
            <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
               <BookOpen className="h-12 w-12 text-slate-200 mx-auto mb-4" />
               <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Nenhum registro encontrado com esses filtros.</p>
            </div>
          )}
        </div>
      </section>

      {context && (
        <PatientLogForm 
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setActivePromptId(null); }}
          onSuccess={fetchData}
          patientId={context.patientId}
          psychologistId={context.psychologistId}
          promptId={activePromptId}
        />
      )}
    </div>
  );
};

export default PatientDiaryPage;
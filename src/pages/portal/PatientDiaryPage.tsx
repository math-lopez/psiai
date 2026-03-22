"use client";

import React, { useState, useEffect } from "react";
import { PatientLog, PatientLogPrompt } from "@/types/diary";
import { diaryService } from "@/services/diaryService";
import { 
  BookOpen, 
  Plus, 
  Loader2, 
  History, 
  Sparkles, 
  ClipboardCheck,
  Calendar,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PatientLogForm } from "@/components/diary/PatientLogForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { showError } from "@/utils/toast";

const PatientDiaryPage = () => {
  const [logs, setLogs] = useState<PatientLog[]>([]);
  const [prompts, setPrompts] = useState<PatientLogPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const pid = await diaryService.getMyPatientId();
      if (!pid) return;
      setPatientId(pid);

      const [l, p] = await Promise.all([
        diaryService.listLogs(pid),
        diaryService.listPrompts(pid)
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

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  const activePrompts = prompts.filter(p => p.status === 'active');

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

      {/* Seção de Tarefas Pendentes */}
      {activePrompts.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 px-2 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" /> Tarefas Pendentes
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
          </div>
        </section>
      )}

      {/* Histórico de Registros */}
      <section className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-2">
          <History className="h-4 w-4" /> Histórico de Registros
        </h3>
        
        <div className="space-y-4">
          {logs.length > 0 ? logs.map((log) => (
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
               <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Seu diário ainda está vazio.</p>
            </div>
          )}
        </div>
      </section>

      {patientId && (
        <PatientLogForm 
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setActivePromptId(null); }}
          onSuccess={fetchData}
          patientId={patientId}
          promptId={activePromptId}
        />
      )}
    </div>
  );
};

export default PatientDiaryPage;
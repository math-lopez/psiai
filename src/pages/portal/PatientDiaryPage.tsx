"use client";

import React, { useState, useEffect } from "react";
import { PatientLog, PatientLogPrompt } from "@/types/diary";
import { diaryService } from "@/services/diaryService";
import { 
  BookOpen, 
  Plus, 
  Loader2, 
  History, 
  ClipboardCheck,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PatientLogForm } from "@/components/diary/PatientLogForm";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showError } from "@/utils/toast";

const PatientDiaryPage = () => {
  const [logs, setLogs] = useState<PatientLog[]>([]);
  const [prompts, setPrompts] = useState<PatientLogPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<{ patientId: string; psychologistId: string } | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const ctx = await diaryService.getPatientContext();
      if (!ctx) {
        setLoading(false);
        return;
      }
      setContext(ctx);

      const [l, p] = await Promise.all([
        diaryService.listLogs(ctx.patientId),
        diaryService.listPrompts(ctx.patientId)
      ]);
      setLogs(l || []);
      setPrompts(p || []);
    } catch (e) {
      console.error("Erro ao carregar diário:", e);
      showError("Erro ao carregar dados do diário.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando seus registros...</p>
    </div>
  );

  const activePrompts = prompts.filter(p => p.status === 'active');

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Meu Diário <Sparkles className="h-6 w-6 text-indigo-500" />
          </h1>
          <p className="text-slate-500 font-medium mt-2">Um espaço para suas reflexões entre as sessões.</p>
        </div>
        <Button 
          onClick={() => { setActivePromptId(null); setIsFormOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-8 shadow-xl shadow-indigo-100 gap-2 font-black text-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-6 w-6" /> Novo Registro
        </Button>
      </div>

      {activePrompts.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 px-4 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" /> Tarefas Sugeridas pelo Psicólogo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePrompts.map((p) => (
              <Card key={p.id} className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white border-l-4 border-l-amber-400">
                <CardContent className="p-6 flex items-center justify-between gap-6">
                  <div className="space-y-1 min-w-0">
                    <p className="font-black text-slate-900 truncate text-lg">{p.title}</p>
                    <p className="text-sm text-slate-500 line-clamp-1">{p.description || "Sem instruções adicionais."}</p>
                  </div>
                  <Button 
                    onClick={() => { setActivePromptId(p.id); setIsFormOpen(true); }}
                    className="bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-2xl h-11 px-5 font-black shrink-0 border-none"
                  >
                    Responder
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-4 flex items-center gap-2">
          <History className="h-4 w-4" /> Histórico de Registros
        </h3>
        
        <div className="grid grid-cols-1 gap-8">
          {logs.length > 0 ? logs.map((log) => {
            const logDate = new Date(log.created_at);
            const isValidDate = isValid(logDate);
            
            return (
              <div key={log.id} className="group p-8 bg-white border border-slate-100 rounded-[40px] shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-6">
                    {log.mood ? (
                      <div className="h-16 w-16 shrink-0 rounded-3xl bg-slate-50 flex items-center justify-center text-4xl shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                        {log.mood}
                      </div>
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <MessageSquare className="h-8 w-8" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 text-2xl leading-tight mb-2 truncate">
                        {log.title || "Anotação do Diário"}
                      </h4>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" /> 
                        {isValidDate ? format(logDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Data não disponível"}
                      </p>
                    </div>
                  </div>
                  {log.created_by === 'psychologist' && (
                    <div className="px-5 py-2 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 shrink-0">
                      Compartilhado pelo Psicólogo
                    </div>
                  )}
                </div>
                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-50">
                  <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{log.content}</p>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-24 bg-white rounded-[60px] border-2 border-dashed border-slate-100">
               <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-slate-200" />
               </div>
               <p className="text-sm text-slate-400 font-black uppercase tracking-widest max-w-xs mx-auto">Sua jornada começa aqui. Faça seu primeiro registro.</p>
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
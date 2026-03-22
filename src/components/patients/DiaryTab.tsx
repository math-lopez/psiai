"use client";

import React, { useState, useEffect } from "react";
import { diaryService } from "@/services/diaryService";
import { PatientLog, PatientLogPrompt, LogType } from "@/types/diary";
import { 
  Book, Plus, History, Clock, CheckCircle2, AlertCircle, 
  Trash2, Filter, User, Calendar, MoreHorizontal, FileText, 
  Smile, MessageSquare, BrainCircuit, Rocket, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

export const DiaryTab = ({ patientId }: { patientId: string }) => {
  const [logs, setLogs] = useState<PatientLog[]>([]);
  const [prompts, setPrompts] = useState<PatientLogPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LogType | 'all'>('all');

  // Modais
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [lData, pData] = await Promise.all([
        diaryService.listLogs(patientId),
        diaryService.listPrompts(patientId)
      ]);
      setLogs(lData);
      setPrompts(pData);
    } catch (e) { showError("Erro ao carregar registros."); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const handleSaveLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const logData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      log_type: formData.get('log_type') as LogType,
      visibility: formData.get('visibility') as any,
      patient_id: patientId,
    };

    try {
      await diaryService.createLog(logData);
      showSuccess("Registro adicionado!");
      setIsLogModalOpen(false);
      fetchData();
    } catch (e) { showError("Erro ao salvar registro."); }
  };

  const handleSavePrompt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const promptData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      prompt_type: formData.get('prompt_type') as string,
      due_date: formData.get('due_date') as string || null,
      patient_id: patientId,
    };

    try {
      await diaryService.createPrompt(promptData);
      showSuccess("Tarefa enviada!");
      setIsPromptModalOpen(false);
      fetchData();
    } catch (e) { showError("Erro ao criar tarefa."); }
  };

  const deleteLog = async (id: string) => {
    if (!confirm("Excluir este registro?")) return;
    try {
      await diaryService.deleteLog(id);
      showSuccess("Registro excluído.");
      fetchData();
    } catch (e) { showError("Erro ao excluir."); }
  };

  const togglePromptStatus = async (prompt: PatientLogPrompt) => {
    const nextStatus = prompt.status === 'active' ? 'completed' : 'active';
    try {
      await diaryService.updatePrompt(prompt.id, { status: nextStatus });
      fetchData();
    } catch (e) { showError("Erro ao atualizar status."); }
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.log_type === filter);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  const logTypeIcons = {
    weekly_journal: { icon: Book, label: "Diário Semanal", color: "text-blue-500", bg: "bg-blue-50" },
    emotional_record: { icon: Smile, label: "Registro Emocional", color: "text-amber-500", bg: "bg-amber-50" },
    thought_record: { icon: BrainCircuit, label: "Pensamentos", color: "text-purple-500", bg: "bg-purple-50" },
    homework: { icon: Rocket, label: "Tarefa Terapêutica", color: "text-indigo-500", bg: "bg-indigo-50" },
    free_entry: { icon: FileText, label: "Anotação Livre", color: "text-slate-500", bg: "bg-slate-50" },
    general: { icon: MessageSquare, label: "Geral", color: "text-slate-500", bg: "bg-slate-50" }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-8">
        {/* Cabeçalho de Ações */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600" />
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Linha do Tempo de Registros</h3>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="h-10 w-[180px] rounded-2xl border-none bg-white shadow-sm font-bold text-xs uppercase tracking-widest text-slate-500">
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="Filtrar tipo" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">Todos os registros</SelectItem>
                <SelectItem value="weekly_journal">Diário Semanal</SelectItem>
                <SelectItem value="emotional_record">Registro Emocional</SelectItem>
                <SelectItem value="thought_record">Pensamentos</SelectItem>
                <SelectItem value="homework">Tarefas</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsLogModalOpen(true)} className="bg-indigo-600 h-10 px-6 rounded-2xl font-black shadow-lg shadow-indigo-100 gap-2">
               <Plus className="h-4 w-4" /> Registrar
            </Button>
          </div>
        </div>

        {/* Lista de Logs */}
        <div className="space-y-6">
          {filteredLogs.length > 0 ? filteredLogs.map((log) => {
            const typeInfo = logTypeIcons[log.log_type] || logTypeIcons.general;
            return (
              <Card key={log.id} className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden group hover:shadow-md transition-all">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", typeInfo.bg)}>
                        <typeInfo.icon className={cn("h-5 w-5", typeInfo.color)} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{log.title || typeInfo.label}</h4>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          {format(new Date(log.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="text-red-600 gap-2" onClick={() => deleteLog(log.id)}>
                          <Trash2 className="h-3.5 w-3.5" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap italic">"{log.content}"</p>
                  <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                    <Badge variant="outline" className="border-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest px-2.5">
                      <User className="h-2 w-2 mr-1" /> {log.created_by === 'psychologist' ? 'Psicólogo' : 'Paciente'}
                    </Badge>
                    <Badge variant="outline" className="border-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest px-2.5">
                      {log.visibility === 'private_to_psychologist' ? '🔒 Privado' : '👥 Compartilhado'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          }) : (
            <div className="text-center py-20 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
               <Book className="h-10 w-10 text-slate-200 mx-auto mb-3" />
               <p className="text-sm text-slate-400 font-medium">Nenhum registro encontrado para este paciente.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar: Tarefas Terapêuticas */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
             <Rocket className="h-4 w-4" /> Tarefas Ativas
           </h3>
           <Button variant="ghost" size="icon" onClick={() => setIsPromptModalOpen(true)} className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600">
             <Plus className="h-4 w-4" />
           </Button>
        </div>

        <div className="space-y-4">
          {prompts.filter(p => p.status === 'active').length > 0 ? prompts.filter(p => p.status === 'active').map((prompt) => (
            <Card key={prompt.id} className="border-none shadow-sm rounded-[28px] bg-white overflow-hidden group">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start justify-between gap-3">
                   <h4 className="font-bold text-sm text-slate-900 leading-tight">{prompt.title}</h4>
                   <button onClick={() => togglePromptStatus(prompt)} className="h-5 w-5 rounded-full border-2 border-slate-200 group-hover:border-indigo-400 transition-colors flex items-center justify-center shrink-0">
                     <div className="h-2.5 w-2.5 rounded-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </button>
                </div>
                {prompt.description && <p className="text-xs text-slate-500 line-clamp-2">{prompt.description}</p>}
                {prompt.due_date && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase pt-2">
                    <Calendar className="h-3 w-3" /> Prazo: {format(new Date(prompt.due_date), "dd/MM", { locale: ptBR })}
                  </div>
                )}
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-10 bg-white rounded-[32px] border border-slate-50">
               <p className="text-[10px] font-black uppercase text-slate-300">Sem tarefas pendentes</p>
            </div>
          )}

          {prompts.filter(p => p.status === 'completed').length > 0 && (
            <div className="pt-6">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" /> Concluídas
              </h4>
              <div className="space-y-2 opacity-60 grayscale">
                {prompts.filter(p => p.status === 'completed').slice(0, 3).map(p => (
                   <div key={p.id} className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-600 line-through">{p.title}</span>
                   </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Log */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Registrar Acompanhamento</DialogTitle>
            <DialogDescription>Anotações entre sessões sobre a evolução do paciente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveLog} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="log_type" className="text-xs font-black uppercase text-slate-400">Tipo de Registro</Label>
                <Select name="log_type" defaultValue="general" required>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="weekly_journal">Diário Semanal</SelectItem>
                    <SelectItem value="emotional_record">Registro Emocional</SelectItem>
                    <SelectItem value="thought_record">Pensamento</SelectItem>
                    <SelectItem value="homework">Tarefa</SelectItem>
                    <SelectItem value="free_entry">Anotação Livre</SelectItem>
                    <SelectItem value="general">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visibility" className="text-xs font-black uppercase text-slate-400">Visibilidade</Label>
                <Select name="visibility" defaultValue="private_to_psychologist" required>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="private_to_psychologist">🔒 Privado</SelectItem>
                    <SelectItem value="shared_with_patient">👥 Compartilhado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-black uppercase text-slate-400">Título (Opcional)</Label>
              <Input id="title" name="title" className="rounded-xl h-12" placeholder="Ex: Crise de ansiedade no trabalho" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content" className="text-xs font-black uppercase text-slate-400">Conteúdo do Registro</Label>
              <Textarea id="content" name="content" required className="rounded-xl min-h-[150px]" placeholder="Descreva os fatos ou observações..." />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full bg-indigo-600 rounded-2xl h-12 font-black shadow-lg shadow-indigo-100">Salvar Registro</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Prompt */}
      <Dialog open={isPromptModalOpen} onOpenChange={setIsPromptModalOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Nova Tarefa / Prompt</DialogTitle>
            <DialogDescription>Solicite que o paciente realize um registro específico.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePrompt} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="p-type" className="text-xs font-black uppercase text-slate-400">Tipo de Solicitação</Label>
              <Select name="prompt_type" defaultValue="homework" required>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="weekly_journal">Resumo Semanal</SelectItem>
                  <SelectItem value="emotional_record">Monitoramento de Humor</SelectItem>
                  <SelectItem value="thought_record">Registro de Pensamentos</SelectItem>
                  <SelectItem value="homework">Tarefa Terapêutica</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-title" className="text-xs font-black uppercase text-slate-400">O que o paciente deve fazer?</Label>
              <Input id="p-title" name="title" required className="rounded-xl h-12" placeholder="Ex: Registrar sentimentos após a reunião" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-xs font-black uppercase text-slate-400">Data Alvo (Opcional)</Label>
              <Input id="due_date" name="due_date" type="date" className="rounded-xl h-12" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full bg-indigo-600 rounded-2xl h-12 font-black shadow-lg shadow-indigo-100">Enviar Tarefa</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
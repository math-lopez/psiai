"use client";

import React, { useState, useEffect } from "react";
import { LogType, VisibilityType, PatientLog } from "@/types/diary";
import { diaryService } from "@/services/diaryService";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, BookOpen, Smile, Eye, EyeOff } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface LogFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: string;
  editingLog?: PatientLog | null;
}

const moods = [
  { emoji: "😊", label: "Feliz" },
  { emoji: "😐", label: "Neutro" },
  { emoji: "😔", label: "Triste" },
  { emoji: "😡", label: "Irritado" },
  { emoji: "😨", label: "Ansioso" },
  { emoji: "😴", label: "Cansado" },
  { emoji: "😌", label: "Calmo" },
];

export const LogForm = ({ isOpen, onClose, onSuccess, patientId, editingLog }: LogFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    log_type: "weekly_journal" as LogType,
    mood: "",
    visibility: "private_to_psychologist" as VisibilityType,
  });

  useEffect(() => {
    if (editingLog) {
      setFormData({
        title: editingLog.title || "",
        content: editingLog.content,
        log_type: editingLog.log_type,
        mood: editingLog.mood || "",
        visibility: editingLog.visibility,
      });
    } else {
      setFormData({
        title: "",
        content: "",
        log_type: "weekly_journal",
        mood: "",
        visibility: "private_to_psychologist",
      });
    }
  }, [editingLog, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content) return;

    setLoading(true);
    try {
      if (editingLog) {
        await diaryService.updateLog(editingLog.id, formData);
        showSuccess("Registro atualizado!");
      } else {
        await diaryService.createLog({
          ...formData,
          patient_id: patientId,
          created_by: 'psychologist'
        });
        showSuccess("Registro criado!");
      }
      onSuccess();
      onClose();
    } catch (e) {
      showError("Erro ao salvar registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-3">
            <BookOpen className="text-primary h-6 w-6" /> 
            {editingLog ? "Editar Registro" : "Novo Registro no Diário"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Título do Registro</Label>
              <Input 
                placeholder="Ex: Reflexões sobre o trabalho" 
                className="h-12 rounded-2xl border-slate-200 font-bold"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Tipo de Conteúdo</Label>
              <Select value={formData.log_type} onValueChange={(v: any) => setFormData({...formData, log_type: v})}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="weekly_journal">Diário da Semana</SelectItem>
                  <SelectItem value="emotional_record">Registro Emocional</SelectItem>
                  <SelectItem value="thought_record">Registro de Pensamentos</SelectItem>
                  <SelectItem value="homework">Tarefa Terapêutica</SelectItem>
                  <SelectItem value="free_entry">Anotação Livre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Conteúdo do Registro</Label>
            <Textarea 
              placeholder="O que aconteceu? Como o paciente se sentiu?" 
              className="min-h-[200px] rounded-3xl border-slate-200 resize-none leading-relaxed"
              required
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
              <Smile className="h-3 w-3" /> Humor predominante
            </Label>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setFormData({...formData, mood: m.emoji})}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all hover:bg-slate-50",
                    formData.mood === m.emoji ? "bg-indigo-50 border-indigo-200 shadow-sm scale-105" : "bg-white border-slate-100"
                  )}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{m.label}</span>
                </button>
              ))}
              {formData.mood && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-[8px] font-black uppercase text-red-500 hover:bg-red-50 h-auto p-1 mt-auto"
                  onClick={() => setFormData({...formData, mood: ""})}
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl", formData.visibility === 'shared_with_patient' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500')}>
                {formData.visibility === 'shared_with_patient' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Visibilidade</p>
                <p className="text-[10px] text-slate-500">
                  {formData.visibility === 'shared_with_patient' ? 'O paciente poderá ler este registro futuramente.' : 'Apenas você tem acesso a este conteúdo.'}
                </p>
              </div>
            </div>
            <Select value={formData.visibility} onValueChange={(v: any) => setFormData({...formData, visibility: v})}>
              <SelectTrigger className="w-[160px] h-9 rounded-xl border-slate-200 text-[10px] font-black uppercase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="private_to_psychologist">Privado (Só eu)</SelectItem>
                <SelectItem value="shared_with_patient">Compartilhado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading || !formData.content}
              className="w-full bg-primary hover:bg-primary/90 rounded-2xl h-12 font-black shadow-lg shadow-primary/10"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingLog ? "Salvar Alterações" : "Salvar no Diário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
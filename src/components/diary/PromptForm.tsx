"use client";

import React, { useState } from "react";
import { PromptType } from "@/types/diary";
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
import { Loader2, ClipboardCheck, Calendar } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface PromptFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: string;
}

export const PromptForm = ({ isOpen, onClose, onSuccess, patientId }: PromptFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prompt_type: "homework" as PromptType,
    due_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    setLoading(true);
    try {
      await diaryService.createPrompt({
        ...formData,
        patient_id: patientId,
        status: 'active'
      });
      showSuccess("Tarefa atribuída!");
      onSuccess();
      onClose();
      setFormData({ title: "", description: "", prompt_type: "homework", due_date: "" });
    } catch (e) {
      showError("Erro ao criar tarefa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-3">
            <ClipboardCheck className="text-amber-500 h-6 w-6" /> 
            Nova Tarefa / Prompt
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">O que o paciente deve fazer?</Label>
            <Input 
              placeholder="Ex: Registrar humor diário por 7 dias" 
              className="h-12 rounded-2xl border-slate-200 font-bold"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Tipo de Solicitação</Label>
              <Select value={formData.prompt_type} onValueChange={(v: any) => setFormData({...formData, prompt_type: v})}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="homework">Tarefa Terapêutica</SelectItem>
                  <SelectItem value="weekly_journal">Diário Semanal</SelectItem>
                  <SelectItem value="emotional_record">Registro Emocional</SelectItem>
                  <SelectItem value="thought_record">Registro de Pensamentos</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Prazo (Opcional)
              </Label>
              <Input 
                type="date" 
                className="h-12 rounded-2xl border-slate-200 font-bold"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Instruções Adicionais</Label>
            <Textarea 
              placeholder="Explique como a tarefa deve ser feita..." 
              className="min-h-[100px] rounded-2xl border-slate-200 resize-none leading-relaxed"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading || !formData.title}
              className="w-full bg-amber-500 hover:bg-amber-600 rounded-2xl h-12 font-black shadow-lg shadow-amber-100"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atribuir para o Paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
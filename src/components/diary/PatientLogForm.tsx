"use client";

import React, { useState } from "react";
import { LogType, PatientLog } from "@/types/diary";
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
import { Loader2, Smile, Heart } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface PatientLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: string;
  psychologistId: string; // Novo campo obrigatório
  promptId?: string | null;
  initialType?: LogType;
}

const moods = [
  { emoji: "😊", label: "Feliz" },
  { emoji: "😌", label: "Calmo" },
  { emoji: "😐", label: "Neutro" },
  { emoji: "😔", label: "Triste" },
  { emoji: "😨", label: "Ansioso" },
  { emoji: "😡", label: "Irritado" },
  { emoji: "😴", label: "Cansado" },
];

export const PatientLogForm = ({ isOpen, onClose, onSuccess, patientId, psychologistId, promptId, initialType }: PatientLogFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    log_type: initialType || "free_entry" as LogType,
    mood: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content) return;

    setLoading(true);
    try {
      await diaryService.createLog({
        ...formData,
        patient_id: patientId,
        psychologist_id: psychologistId, // Enviando o ID do psicólogo corretamente
        created_by: 'patient',
        visibility: 'shared_with_patient'
      });

      if (promptId) {
        await diaryService.updatePrompt(promptId, { status: 'completed' });
      }

      showSuccess("Registro salvo com sucesso!");
      onSuccess();
      onClose();
      setFormData({ title: "", content: "", log_type: "free_entry", mood: "" });
    } catch (e: any) {
      showError(e.message || "Erro ao salvar registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[32px] border-none shadow-2xl p-6 md:p-8 max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-3">
            <Heart className="text-pink-500 h-6 w-6" /> 
            {promptId ? "Responder Tarefa" : "Como você está?"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
              <Smile className="h-3 w-3" /> Seu humor agora
            </Label>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setFormData({...formData, mood: m.emoji})}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all active:scale-95",
                    formData.mood === m.emoji ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-white border-slate-100"
                  )}
                >
                  <span className="text-2xl">{m.emoji}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Título (Opcional)</Label>
            <Input 
              placeholder="Dê um nome a esse registro..." 
              className="h-12 rounded-2xl border-slate-200 font-bold"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">O que aconteceu?</Label>
            <Textarea 
              placeholder="Sinta-se à vontade para escrever o que está pensando ou sentindo..." 
              className="min-h-[150px] rounded-2xl border-slate-200 resize-none leading-relaxed text-sm"
              required
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading || !formData.content}
              className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 font-black shadow-lg shadow-indigo-100 text-lg"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar no Meu Diário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
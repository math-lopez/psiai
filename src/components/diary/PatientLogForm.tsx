"use client";

import React, { useState } from "react";
import { LogType } from "@/types/diary";
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
import { Loader2, Smile, Heart, Sparkles } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface PatientLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: string;
  psychologistId: string;
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
        psychologist_id: psychologistId,
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
      <DialogContent className="rounded-[40px] border-none shadow-2xl p-6 md:p-10 max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader className="text-center md:text-left">
          <DialogTitle className="text-3xl font-black flex items-center justify-center md:justify-start gap-3">
            <div className="bg-pink-100 p-2.5 rounded-2xl">
              <Heart className="text-pink-500 h-7 w-7 fill-pink-500" /> 
            </div>
            {promptId ? "Minha Resposta" : "Como estou agora?"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Smile className="h-4 w-4" /> Escolha seu humor predominante
            </Label>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {moods.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setFormData({...formData, mood: m.emoji})}
                  title={m.label}
                  className={cn(
                    "flex flex-col items-center justify-center h-16 w-16 rounded-2xl border-2 transition-all duration-300",
                    formData.mood === m.emoji 
                      ? "bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg shadow-indigo-100" 
                      : "bg-white border-slate-100 text-3xl hover:border-indigo-200 hover:bg-slate-50"
                  )}
                >
                  <span className={cn("transition-all", formData.mood === m.emoji ? "text-3xl" : "text-2xl")}>
                    {m.emoji}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">O que está acontecendo?</Label>
            <Textarea 
              placeholder="Escreva sobre seus pensamentos, sentimentos ou sobre o que aconteceu..." 
              className="min-h-[200px] rounded-3xl border-slate-100 bg-slate-50/50 p-6 focus:bg-white focus:border-indigo-300 transition-all resize-none text-lg font-medium leading-relaxed"
              required
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Título do Momento (Opcional)</Label>
            <Input 
              placeholder="Dê um nome a este registro..." 
              className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-bold focus:bg-white focus:border-indigo-300 transition-all"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="submit" 
              disabled={loading || !formData.content}
              className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-3xl h-16 font-black shadow-xl shadow-indigo-100 text-xl gap-3 transition-transform active:scale-95"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Sparkles className="h-6 w-6" /> Salvar no Meu Diário</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
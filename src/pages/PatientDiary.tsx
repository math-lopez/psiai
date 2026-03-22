import { useState, useEffect } from "react";
import { Book, Save, Plus, Loader2, Sparkles, History, Smile, Meh, Frown, Shield, Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { diaryService } from "@/services/diaryService";
import { PatientLog, VisibilityType } from "@/types/diary";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PatientDiary = () => {
  const [logs, setLogs] = useState<PatientLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [context, setContext] = useState<any>(null);

  const [newLog, setNewLog] = useState({
    content: "",
    mood: "radiante",
    visibility: "shared_with_psychologist" as VisibilityType,
  });

  const fetchData = async () => {
    try {
      const ctx = await diaryService.getPatientContext();
      if (ctx) {
        setContext(ctx);
        const data = await diaryService.listLogs(ctx.patientId);
        setLogs(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.content.trim()) return;
    setSubmitting(true);
    try {
      await diaryService.createLog({
        ...newLog,
        patient_id: context.patientId,
        psychologist_id: context.psychologistId,
        log_type: 'free_entry', // Alterado de 'general' para 'free_entry' para maior compatibilidade
        created_by: 'patient'
      });
      showSuccess("Registro salvo no diário!");
      setNewLog({ ...newLog, content: "" });
      fetchData();
    } catch (e: any) {
      showError(e.message || "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Meu Diário</h1>
          <p className="text-slate-500">Expresse o que está sentindo agora.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-sm font-black uppercase text-slate-500 tracking-widest">Novo Registro</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-700">Como você está se sentindo?</Label>
                  <div className="flex gap-4">
                    {['radiante', 'bem', 'neutro', 'cansado', 'triste'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNewLog({...newLog, mood: m})}
                        className={`flex-1 p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                          newLog.mood === m ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-slate-200 text-slate-400'
                        }`}
                      >
                        <Smile className="h-6 w-6" />
                        <span className="text-[10px] font-black uppercase">{m}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Seus pensamentos</Label>
                  <Textarea 
                    placeholder="O que passou pela sua cabeça hoje?" 
                    className="min-h-[200px] rounded-2xl border-slate-200 resize-none focus:ring-indigo-600"
                    value={newLog.content}
                    onChange={(e) => setNewLog({...newLog, content: e.target.value})}
                  />
                </div>

                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">Privacidade do Registro</Label>
                  <RadioGroup value={newLog.visibility} onValueChange={(v: any) => setNewLog({...newLog, visibility: v})} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={`flex items-center space-x-2 p-3 rounded-xl border bg-white ${newLog.visibility === 'shared_with_psychologist' ? 'border-indigo-600' : 'border-transparent'}`}>
                      <RadioGroupItem value="shared_with_psychologist" id="v1" />
                      <Label htmlFor="v1" className="flex items-center gap-2 text-xs font-bold cursor-pointer"><Users className="h-3 w-3" /> Compartilhar com meu Psicólogo</Label>
                    </div>
                    <div className={`flex items-center space-x-2 p-3 rounded-xl border bg-white ${newLog.visibility === 'private_to_patient' ? 'border-indigo-600' : 'border-transparent'}`}>
                      <RadioGroupItem value="private_to_patient" id="v2" />
                      <Label htmlFor="v2" className="flex items-center gap-2 text-xs font-bold cursor-pointer"><Lock className="h-3 w-3" /> Apenas para mim (Privado)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl font-bold shadow-lg shadow-indigo-100" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar no Diário
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><History className="h-4 w-4" /> Histórico Recente</h3>
          {logs.length > 0 ? logs.slice(0, 5).map((log) => (
            <div key={log.id} className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-slate-400">{format(new Date(log.created_at), "dd MMM, HH:mm", { locale: ptBR })}</span>
                <div className="px-2 py-0.5 rounded-full bg-indigo-50 text-[8px] font-black text-indigo-600 uppercase tracking-widest">{log.mood}</div>
              </div>
              <p className="text-sm text-slate-700 line-clamp-3 italic leading-relaxed">"{log.content}"</p>
              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2">
                {log.visibility === 'shared_with_psychologist' ? <Users className="h-3 w-3 text-indigo-400" /> : <Lock className="h-3 w-3 text-slate-300" />}
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {log.visibility === 'shared_with_psychologist' ? 'Compartilhado' : 'Privado'}
                </span>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 opacity-50"><Book className="h-8 w-8 mx-auto mb-2 text-slate-200" /><p className="text-xs">Nenhum registro.</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDiary;
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { ChevronLeft, Save, Upload, Mic, FileText, Loader2, X, Music, CheckCircle2, Lock, Sparkles, Check, ChevronsUpDown, Search, ClipboardList, Zap, Quote, CloudCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { patientService } from "@/services/patientService";
import { sessionService } from "@/services/sessionService";
import { Patient, SessionRecordType } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { validateAudioFile } from "@/lib/file-utils";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionTier } from "@/config/plans";
import { formatToLocalISO, formatToUTCISO, cn } from "@/lib/utils";

const SessionFormPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [recordType, setRecordType] = useState<SessionRecordType>("ambos");
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: "",
    session_date: formatToLocalISO(),
    duration_minutes: 50,
    manual_notes: "",
    clinical_notes: "",
    interventions: "",
    session_summary_manual: "",
  });
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [existingAudioName, setExistingAudioName] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user?.id).maybeSingle();
        setTier(profile?.subscription_tier as SubscriptionTier || "free");

        const pats = await patientService.list();
        setPatients(pats);

        const initialPatientId = location.state?.patientId;

        if (id) {
          const session = await sessionService.getById(id);
          if (session) {
            setFormData({
              patient_id: session.patient_id,
              session_date: formatToLocalISO(session.session_date),
              duration_minutes: session.duration_minutes,
              manual_notes: session.manual_notes || "",
              clinical_notes: session.clinical_notes || "",
              interventions: session.interventions || "",
              session_summary_manual: session.session_summary_manual || "",
            });
            setRecordType(session.record_type);
            setExistingAudioName(session.audio_file_name);
          }
        } else if (initialPatientId) {
          setFormData(prev => ({ ...prev, patient_id: initialPatientId }));
        }
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, location.state]);

  // Lógica de Autosave para campos clínicos
  useEffect(() => {
    if (!id || loading) return;

    const timer = setTimeout(async () => {
      setIsAutosaving(true);
      try {
        await sessionService.update(id, {
          clinical_notes: formData.clinical_notes,
          interventions: formData.interventions,
          session_summary_manual: formData.session_summary_manual,
          manual_notes: formData.manual_notes
        });
      } catch (e) {
        console.error("Erro no autosave:", e);
      } finally {
        setTimeout(() => setIsAutosaving(false), 1000);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData.clinical_notes, formData.interventions, formData.session_summary_manual, formData.manual_notes, id, loading]);

  const handleSave = async (e: React.FormEvent, shouldFinish: boolean = false) => {
    e.preventDefault();
    if (!formData.patient_id) {
      showError("Por favor, selecione um paciente.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        session_date: formatToUTCISO(formData.session_date),
        record_type: recordType
      };

      let savedSession;
      if (id) {
        savedSession = await sessionService.update(id, payload, audioFile || undefined);
      } else {
        savedSession = await sessionService.create(payload, audioFile || undefined);
      }

      if (shouldFinish) {
        await sessionService.finishSession(savedSession.id);
        showSuccess(audioFile || existingAudioName ? "Sessão enviada para processamento!" : "Sessão finalizada com sucesso!");
      } else {
        showSuccess("Rascunho salvo com sucesso!");
      }
      navigate("/sessoes");
    } catch (error: any) {
      showError(error.message || "Erro ao salvar sessão");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-indigo-600" /></div>;

  const selectedPatient = patients.find(p => p.id === formData.patient_id);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{id ? "Registro de Atendimento" : "Nova Sessão"}</h1>
            <p className="text-slate-500">Preencha os dados clínicos e técnicos do atendimento.</p>
          </div>
        </div>
        
        {id && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all duration-500",
            isAutosaving ? "bg-indigo-50 text-indigo-600 animate-pulse" : "bg-emerald-50 text-emerald-600"
          )}>
            {isAutosaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CloudCheck className="h-3 w-3" />}
            {isAutosaving ? "Salvando alterações..." : "Sincronizado na nuvem"}
          </div>
        )}
      </div>

      <form className="space-y-8">
        {/* Seção 1: Informações Básicas e Áudio */}
        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
          <div className="h-1.5 w-full bg-slate-100" />
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Paciente vinculado</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-bold h-12 rounded-2xl border-slate-200" disabled={!!id}>
                      {selectedPatient ? selectedPatient.full_name : "Buscar paciente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Nome do paciente..." />
                      <CommandList>
                        <CommandEmpty>Paciente não encontrado.</CommandEmpty>
                        <CommandGroup>
                          {patients.map((p) => (
                            <CommandItem key={p.id} value={p.full_name} onSelect={() => { setFormData({ ...formData, patient_id: p.id }); setOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", formData.patient_id === p.id ? "opacity-100" : "opacity-0")} />
                              {p.full_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Data e Horário</Label>
                  <Input type="datetime-local" className="h-12 rounded-2xl border-slate-200 font-medium" value={formData.session_date} onChange={(e) => setFormData({...formData, session_date: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Duração (min)</Label>
                  <Input type="number" className="h-12 rounded-2xl border-slate-200 font-medium" value={formData.duration_minutes} onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})} />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Método de Registro</Label>
              <RadioGroup value={recordType} className="grid grid-cols-1 md:grid-cols-2 gap-4" onValueChange={(v: any) => { if (v === 'ambos' && tier === 'free') { showError("Upgrade necessário para gravar áudio."); return; } setRecordType(v); }}>
                <div className="flex items-center space-x-3 border p-5 rounded-3xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <FileText className="h-4 w-4 text-slate-400" /> Apenas Escrita
                  </Label>
                </div>
                <div className={cn("flex items-center space-x-3 border p-5 rounded-3xl cursor-pointer hover:bg-slate-50 transition-colors relative", tier === 'free' && 'opacity-60 bg-slate-50')}>
                  <RadioGroupItem value="ambos" id="ambos" disabled={tier === 'free'} />
                  <Label htmlFor="ambos" className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <Mic className="h-4 w-4 text-indigo-500" /> Áudio + Escrita
                    {tier === 'free' && <Lock className="h-3 w-3 text-slate-400" />}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {(recordType === 'audio' || recordType === 'ambos') && tier !== 'free' && (
              <div className="space-y-4 pt-4">
                {existingAudioName || audioFile ? (
                  <div className="flex items-center justify-between p-6 bg-indigo-50 border border-indigo-100 rounded-[24px]">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm"><Mic className="h-6 w-6 text-indigo-600" /></div>
                      <div>
                        <p className="text-sm font-bold text-indigo-900">{audioFile ? audioFile.name : existingAudioName}</p>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{audioFile ? `${(audioFile.size / (1024 * 1024)).toFixed(2)} MB` : "Registrado"}</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="text-indigo-600 hover:bg-white rounded-xl" onClick={() => { setAudioFile(null); setExistingAudioName(null); }}>
                      <X className="h-4 w-4 mr-1" /> Substituir
                    </Button>
                  </div>
                ) : (
                  <div className="relative group">
                    <input type="file" accept=".mp3,.wav,.m4a,.webm,audio/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const validation = validateAudioFile(file); if (!validation.valid) { showError(validation.error!); e.target.value = ''; return; } setAudioFile(file); } }} />
                    <div className="border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center group-hover:border-indigo-300 group-hover:bg-slate-50 transition-all">
                      <div className="flex flex-col items-center gap-3">
                        <Upload className="h-10 w-10 text-slate-300 group-hover:text-indigo-400 group-hover:scale-110 transition-all" />
                        <p className="text-slate-500 font-bold">Clique ou arraste o áudio da sessão</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">MP3, WAV, M4A (Máx 50MB)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção 2: Registro Clínico Estruturado (A Grande Novidade da Fase 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
            <div className="h-1.5 w-full bg-blue-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <ClipboardList className="h-5 w-5 text-blue-500" /> Notas Clínicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Observações técnicas, fenomenologia, humor, transferência..." 
                className="min-h-[300px] rounded-3xl border-slate-100 focus:border-blue-300 resize-none text-sm leading-relaxed"
                value={formData.clinical_notes}
                onChange={(e) => setFormData({...formData, clinical_notes: e.target.value})}
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
            <div className="h-1.5 w-full bg-indigo-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Zap className="h-5 w-5 text-indigo-500" /> Intervenções
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Técnicas aplicadas, confrontações, tarefas de casa..." 
                className="min-h-[300px] rounded-3xl border-slate-100 focus:border-indigo-300 resize-none text-sm leading-relaxed"
                value={formData.interventions}
                onChange={(e) => setFormData({...formData, interventions: e.target.value})}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
          <div className="h-1.5 w-full bg-emerald-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <Quote className="h-5 w-5 text-emerald-500" /> Síntese da Sessão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              placeholder="Um resumo executivo do que foi trabalhado hoje (manual)..." 
              className="min-h-[150px] rounded-3xl border-slate-100 focus:border-emerald-300 resize-none text-sm leading-relaxed font-medium"
              value={formData.session_summary_manual}
              onChange={(e) => setFormData({...formData, session_summary_manual: e.target.value})}
            />
          </CardContent>
        </Card>

        {/* Footer de Ações */}
        <div className="flex flex-col md:flex-row justify-end gap-3 pt-6">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={submitting} className="rounded-2xl h-12 font-bold px-8">
            Voltar
          </Button>
          <Button type="button" variant="secondary" className="gap-2 rounded-2xl h-12 font-bold px-8" disabled={submitting} onClick={(e) => handleSave(e, false)}>
            {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Salvar Rascunho
          </Button>
          <Button type="button" className="bg-primary hover:bg-primary/90 rounded-2xl h-12 font-black px-12 shadow-xl shadow-primary/20 gap-2" disabled={submitting} onClick={(e) => handleSave(e, true)}>
            {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            Finalizar Atendimento
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SessionFormPage;
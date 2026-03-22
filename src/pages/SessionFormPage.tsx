import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { 
  ChevronLeft, Save, Upload, Mic, FileText, Loader2, X, Music, 
  CheckCircle2, Lock, Sparkles, Stethoscope, ClipboardCheck, 
  Info, FileAudio, Check, ChevronsUpDown, Search as SearchIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { patientService } from "@/services/patientService";
import { sessionService } from "@/services/sessionService";
import { Patient, SessionRecordType } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { validateAudioFile } from "@/lib/file-utils";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionTier } from "@/config/plans";
import { cn, getLocalDateTime } from "@/lib/utils";

const SessionFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recordType, setRecordType] = useState<SessionRecordType>("ambos");
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [openPatientSelect, setOpenPatientSelect] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: "",
    session_date: getLocalDateTime(),
    duration_minutes: 50,
    manual_notes: "",
    clinical_notes: "",
    interventions: "",
    session_summary_manual: "",
  });
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [existingAudioName, setExistingAudioName] = useState<string | null>(null);
  const initialLoad = useRef(true);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).maybeSingle();
        setTier(profile?.subscription_tier as SubscriptionTier || "free");

        const pats = await patientService.list();
        setPatients(pats);

        if (id) {
          const session = await sessionService.getById(id);
          if (session) {
            setFormData({
              patient_id: session.patient_id,
              session_date: new Date(session.session_date).toISOString().slice(0, 16),
              duration_minutes: session.duration_minutes,
              manual_notes: session.manual_notes || "",
              clinical_notes: session.clinical_notes || "",
              interventions: session.interventions || "",
              session_summary_manual: session.session_summary_manual || "",
            });
            setRecordType(session.record_type);
            setExistingAudioName(session.audio_file_name);
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadData();
  }, [id]);

  // Lógica de Autosave
  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }

    if (!id || loading) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    setSaving(true);
    saveTimeout.current = setTimeout(async () => {
      try {
        await sessionService.update(id, { ...formData, record_type: recordType });
      } catch (e) { console.error("Erro no autosave:", e); } finally { setSaving(false); }
    }, 1500);

    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [formData, recordType, id, loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (tier === 'free') {
      showError("Upgrade necessário para áudio.");
      e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateAudioFile(file);
    if (!validation.valid) { showError(validation.error!); e.target.value = ''; return; }
    setAudioFile(file);
    setExistingAudioName(null);
  };

  const removeFile = () => {
    setAudioFile(null);
    setExistingAudioName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent, shouldFinish: boolean = false) => {
    e.preventDefault();
    if (!formData.patient_id) { showError("Selecione um paciente."); return; }
    setSubmitting(true);
    try {
      let savedSession;
      if (id) {
        savedSession = await sessionService.update(id, { ...formData, record_type: recordType }, audioFile || undefined);
      } else {
        savedSession = await sessionService.create({ ...formData, record_type: recordType }, audioFile || undefined);
      }
      if (shouldFinish) {
        await sessionService.finishSession(savedSession.id);
        showSuccess("Sessão finalizada!");
      } else { showSuccess("Rascunho salvo!"); }
      navigate("/sessoes");
    } catch (error: any) { showError(error.message || "Erro ao salvar"); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-indigo-600" /></div>;

  const showAudioUpload = recordType === 'audio' || recordType === 'ambos';
  const selectedPatient = patients.find((p) => p.id === formData.patient_id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-2xl"><ChevronLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{id ? "Editar Atendimento" : "Novo Atendimento"}</h1>
            <p className="text-slate-500 text-sm font-medium">Registre os detalhes clínicos da sessão.</p>
          </div>
        </div>
        {saving && <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-400 animate-pulse"><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</div>}
      </div>

      <form className="space-y-6">
        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-8 space-y-10">
            {/* 1. Tipo de Atendimento e Audio */}
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">1. Tipo de Atendimento</Label>
                 {tier === 'free' && (
                   <Badge variant="outline" className="text-[9px] font-black uppercase border-amber-200 text-amber-600 bg-amber-50">Somente Texto no Plano Free</Badge>
                 )}
               </div>

               <RadioGroup value={recordType} onValueChange={(v: any) => setRecordType(v)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={cn(
                    "relative flex items-center justify-between p-6 rounded-[24px] border-2 transition-all cursor-pointer", 
                    recordType === 'manual' ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-50 bg-white hover:border-slate-200'
                  )}>
                    <RadioGroupItem value="manual" id="m" className="sr-only" />
                    <Label htmlFor="m" className="flex items-center gap-4 cursor-pointer w-full">
                      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", recordType === 'manual' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500')}>
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900">Apenas Notas</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Sem processamento de áudio</p>
                      </div>
                    </Label>
                    {recordType === 'manual' && <CheckCircle2 className="h-5 w-5 text-indigo-600 absolute top-4 right-4" />}
                  </div>

                  <div className={cn(
                    "relative flex items-center justify-between p-6 rounded-[24px] border-2 transition-all cursor-pointer", 
                    recordType === 'ambos' ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-50 bg-white hover:border-slate-200',
                    tier === 'free' && 'opacity-50 cursor-not-allowed'
                  )}>
                    <RadioGroupItem value="ambos" id="a" disabled={tier === 'free'} className="sr-only" />
                    <Label htmlFor="a" className="flex items-center gap-4 cursor-pointer w-full">
                      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", recordType === 'ambos' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500')}>
                        <Mic className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900">Áudio + Notas</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Transcrição por IA inclusa</p>
                      </div>
                    </Label>
                    {recordType === 'ambos' && <CheckCircle2 className="h-5 w-5 text-indigo-600 absolute top-4 right-4" />}
                  </div>
               </RadioGroup>

               {showAudioUpload && (
                 <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer",
                        audioFile || existingAudioName ? "bg-indigo-50 border-indigo-200" : "bg-slate-50/50 border-slate-100 hover:border-indigo-300 hover:bg-white"
                      )}
                    >
                      <Input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="audio/*" 
                        onChange={handleFileChange} 
                      />
                      
                      {audioFile || existingAudioName ? (
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="h-16 w-16 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <FileAudio className="h-8 w-8" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-black text-slate-900">{audioFile?.name || existingAudioName}</p>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase">Arquivo pronto para processamento</p>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold"
                          >
                            <X className="h-4 w-4 mr-2" /> Remover arquivo
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="h-12 w-12 bg-white border-2 border-slate-100 text-slate-300 rounded-2xl flex items-center justify-center">
                            <Upload className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">Upload do áudio da sessão</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">MP3, WAV, M4A ou WebM (Máx. 50MB)</p>
                          </div>
                        </div>
                      )}
                    </div>
                 </div>
               )}
            </div>

            {/* 2. Paciente, Data e Hora */}
            <div className="space-y-8 pt-8 border-t border-slate-50">
              <div className="space-y-2 flex flex-col">
                <Label className="text-xs font-black uppercase text-slate-400 mb-1">2. Paciente</Label>
                <Popover open={openPatientSelect} onOpenChange={setOpenPatientSelect}>
                  <PopoverTrigger asChild disabled={!!id}>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openPatientSelect}
                      className={cn(
                        "w-full justify-between rounded-2xl h-12 border-slate-100 bg-slate-50/30 font-medium px-4",
                        !formData.patient_id && "text-slate-400"
                      )}
                    >
                      {selectedPatient ? selectedPatient.full_name : "Buscar paciente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 rounded-2xl overflow-hidden shadow-2xl border-none" align="start">
                    <Command className="rounded-2xl">
                      <CommandInput placeholder="Digite o nome..." className="h-12 border-none focus:ring-0" />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty className="py-6 text-center text-sm text-slate-500">Nenhum paciente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {patients.map((patient) => (
                            <CommandItem
                              key={patient.id}
                              value={patient.full_name}
                              onSelect={() => {
                                setFormData({ ...formData, patient_id: patient.id });
                                setOpenPatientSelect(false);
                              }}
                              className="px-4 py-3 cursor-pointer hover:bg-indigo-50 transition-colors"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-indigo-600",
                                  formData.patient_id === patient.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="font-bold text-slate-700">{patient.full_name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">3. Data e Hora</Label>
                  <Input 
                    type="datetime-local" 
                    className="rounded-2xl h-12 border-slate-100 bg-slate-50/30"
                    value={formData.session_date}
                    onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">4. Duração (minutos)</Label>
                  <Input 
                    type="number" 
                    className="rounded-2xl h-12 border-slate-100 bg-slate-50/30"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            {/* 3. Registro Clínico Estruturado */}
            <div className="space-y-6 pt-8 border-t border-slate-50">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Stethoscope className="h-5 w-5" />
                <h3 className="font-black text-xs uppercase tracking-widest">5. Registro Clínico Estruturado</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Notas de Evolução e Sintomas</Label>
                  <Textarea 
                    placeholder="Quais foram as principais observações clínicas hoje?" 
                    className="min-h-[120px] rounded-2xl resize-none border-slate-100 bg-slate-50/30 focus:bg-white transition-all"
                    value={formData.clinical_notes}
                    onChange={(e) => setFormData({...formData, clinical_notes: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Intervenções Terapêuticas</Label>
                  <Textarea 
                    placeholder="Quais intervenções foram realizadas nesta sessão?" 
                    className="min-h-[100px] rounded-2xl resize-none border-slate-100 bg-slate-50/30 focus:bg-white transition-all"
                    value={formData.interventions}
                    onChange={(e) => setFormData({...formData, interventions: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Resumo Consolidado</Label>
                  <Textarea 
                    placeholder="Resuma os pontos principais do atendimento para o prontuário..." 
                    className="min-h-[100px] rounded-2xl resize-none border-slate-100 bg-slate-50/30 focus:bg-white transition-all"
                    value={formData.session_summary_manual}
                    onChange={(e) => setFormData({...formData, session_summary_manual: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* 4. Rascunho Livre */}
            <div className="space-y-4 pt-8 border-t border-slate-50">
               <Label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">6. Rascunho Livre / Notas Gerais</Label>
               <Textarea 
                placeholder="Anotações livres que não entram necessariamente no prontuário..." 
                className="min-h-[120px] rounded-2xl resize-none border-slate-100 bg-slate-50/30 focus:bg-white transition-all"
                value={formData.manual_notes}
                onChange={(e) => setFormData({...formData, manual_notes: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row justify-end gap-4 pb-10">
          <Button type="button" variant="ghost" className="rounded-2xl h-14 px-8 font-bold text-slate-400 hover:text-slate-600" onClick={() => navigate(-1)} disabled={submitting}>Cancelar</Button>
          
          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1 md:flex-none rounded-2xl h-14 px-8 font-black border-slate-200 bg-white shadow-sm hover:bg-slate-50 gap-2" disabled={submitting} onClick={(e) => handleSave(e, false)}>
              {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />} Salvar Rascunho
            </Button>
            
            <Button type="button" className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-10 font-black shadow-xl shadow-indigo-600/20 gap-2" disabled={submitting} onClick={(e) => handleSave(e, true)}>
              {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />} Finalizar Atendimento
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SessionFormPage;
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { ChevronLeft, Save, Upload, Mic, FileText, Loader2, X, Music, CheckCircle2, Lock, Sparkles, Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  const [recordType, setRecordType] = useState<SessionRecordType>("ambos");
  const [tier, setTier] = useState<SubscriptionTier>("free");
  
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: "",
    session_date: formatToLocalISO(),
    duration_minutes: 50,
    manual_notes: "",
  });
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [existingAudioName, setExistingAudioName] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user?.id)
          .maybeSingle();
        
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

  const handleSave = async (e: React.FormEvent, shouldFinish: boolean = false) => {
    e.preventDefault();
    if (!formData.patient_id) {
      showError("Por favor, selecione um paciente.");
      return;
    }

    setSubmitting(true);
    try {
      // Garantimos que a data seja enviada em UTC para o banco
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{id ? "Editar Sessão" : "Nova Sessão"}</h1>
          <p className="text-slate-500">Registre os detalhes do atendimento.</p>
        </div>
      </div>

      <form className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="patient">Paciente *</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between font-normal h-10 border-slate-200"
                      disabled={!!id}
                    >
                      {selectedPatient ? selectedPatient.full_name : "Selecionar paciente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar paciente..." />
                      <CommandList>
                        <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {patients.map((patient) => (
                            <CommandItem
                              key={patient.id}
                              value={patient.full_name}
                              onSelect={() => {
                                setFormData({ ...formData, patient_id: patient.id });
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.patient_id === patient.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {patient.full_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data e Hora *</Label>
                  <Input 
                    id="date" 
                    type="datetime-local" 
                    required 
                    value={formData.session_date}
                    onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (min)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label>Tipo de Registro</Label>
              <RadioGroup 
                value={recordType} 
                className="flex flex-col md:flex-row gap-4"
                onValueChange={(v: any) => {
                  if (v === 'ambos' && tier === 'free') {
                    showError("Upgrade necessário para gravar áudio.");
                    return;
                  }
                  setRecordType(v);
                }}
              >
                <div className="flex items-center space-x-2 border p-4 rounded-lg flex-1 cursor-pointer">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" /> Apenas Anotações
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 border p-4 rounded-lg flex-1 cursor-pointer relative ${tier === 'free' ? 'opacity-60 bg-slate-50' : ''}`}>
                  <RadioGroupItem value="ambos" id="ambos" disabled={tier === 'free'} />
                  <Label htmlFor="ambos" className="flex items-center gap-2 cursor-pointer">
                    <Mic className="h-4 w-4" /> Áudio + Notas
                    {tier === 'free' && <Lock className="h-3 w-3 text-slate-400" />}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {(recordType === 'audio' || recordType === 'ambos') && tier !== 'free' && (
              <div className="space-y-4 pt-4 border-t">
                <Label className="flex items-center gap-2 text-indigo-600 font-semibold">
                  <Music className="h-4 w-4" /> Arquivo de Áudio
                </Label>
                
                {existingAudioName || audioFile ? (
                  <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-full">
                        <Mic className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-indigo-900">
                          {audioFile ? audioFile.name : existingAudioName}
                        </p>
                        <p className="text-xs text-indigo-500">
                          {audioFile ? `${(audioFile.size / (1024 * 1024)).toFixed(2)} MB` : "Arquivo já enviado"}
                        </p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={() => {
                        setAudioFile(null);
                        setExistingAudioName(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" /> Substituir
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".mp3,.wav,.m4a,.webm,audio/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        if (tier === 'free') {
                          showError("Seu plano atual não permite transcrição de áudio.");
                          e.target.value = '';
                          return;
                        }
                        const file = e.target.files?.[0];
                        if (file) {
                          const validation = validateAudioFile(file);
                          if (!validation.valid) {
                            showError(validation.error!);
                            e.target.value = '';
                            return;
                          }
                          setAudioFile(file);
                          setExistingAudioName(null);
                        }
                      }}
                    />
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 text-center hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-slate-400" />
                        <p className="text-slate-500 font-medium">Clique para selecionar ou arraste o áudio</p>
                        <p className="text-xs text-slate-400">Formatos aceitos: MP3, WAV, M4A, WebM (Max 50MB)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4 pt-4 border-t">
              <Label className="font-semibold text-slate-700">Anotações do Psicólogo</Label>
              <Textarea 
                placeholder="Escreva livremente sobre a sessão..." 
                className="min-h-[250px] resize-none"
                value={formData.manual_notes}
                onChange={(e) => setFormData({...formData, manual_notes: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="button" variant="secondary" className="gap-2" disabled={submitting} onClick={(e) => handleSave(e, false)}>
            {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Salvar Rascunho
          </Button>
          <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-11 px-8" disabled={submitting} onClick={(e) => handleSave(e, true)}>
            {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            Finalizar Sessão
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SessionFormPage;
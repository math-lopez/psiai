import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronLeft, Save, Upload, Mic, FileText, Loader2, X, Music, CheckCircle2, Lock, Sparkles, Stethoscope, ClipboardCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { patientService } from "@/services/patientService";
import { sessionService } from "@/services/sessionService";
import { Patient, SessionRecordType } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { validateAudioFile } from "@/lib/file-utils";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionTier } from "@/config/plans";
import { getLocalDateTime } from "@/lib/utils";

const SessionFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recordType, setRecordType] = useState<SessionRecordType>("ambos");
  const [tier, setTier] = useState<SubscriptionTier>("free");
  
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{id ? "Editar Atendimento" : "Novo Atendimento"}</h1>
            <p className="text-slate-500 text-sm">Registre os detalhes clínicos da sessão.</p>
          </div>
        </div>
        {saving && <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-400 animate-pulse"><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</div>}
      </div>

      <form className="space-y-6">
        <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Paciente</Label>
                <Select required value={formData.patient_id} onValueChange={(v) => setFormData({...formData, patient_id: v})} disabled={!!id}>
                  <SelectTrigger className="rounded-2xl h-12">
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">Data e Hora</Label>
                  <Input 
                    type="datetime-local" 
                    className="rounded-2xl h-12"
                    value={formData.session_date}
                    onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">Duração (min)</Label>
                  <Input 
                    type="number" 
                    className="rounded-2xl h-12"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Stethoscope className="h-5 w-5" />
                <h3 className="font-black text-sm uppercase tracking-widest">Registro Clínico</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Notas Clínicas (Observações de evolução, sintomas, queixas)</Label>
                  <Textarea 
                    placeholder="Quais foram as principais observações clínicas hoje?" 
                    className="min-h-[120px] rounded-2xl resize-none border-slate-100 bg-slate-50/30"
                    value={formData.clinical_notes}
                    onChange={(e) => setFormData({...formData, clinical_notes: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Intervenções Terapêuticas (Técnicas aplicadas, manejo clínico)</Label>
                  <Textarea 
                    placeholder="Quais intervenções foram realizadas nesta sessão?" 
                    className="min-h-[100px] rounded-2xl resize-none border-slate-100 bg-slate-50/30"
                    value={formData.interventions}
                    onChange={(e) => setFormData({...formData, interventions: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Resumo da Sessão (Visão consolidada do atendimento)</Label>
                  <Textarea 
                    placeholder="Resuma os pontos principais do atendimento..." 
                    className="min-h-[100px] rounded-2xl resize-none border-slate-100 bg-slate-50/30"
                    value={formData.session_summary_manual}
                    onChange={(e) => setFormData({...formData, session_summary_manual: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-50">
               <Label className="text-xs font-black uppercase text-slate-400">Anotações Livres</Label>
               <Textarea 
                placeholder="Rascunho livre e anotações gerais..." 
                className="min-h-[150px] rounded-2xl resize-none border-slate-100"
                value={formData.manual_notes}
                onChange={(e) => setFormData({...formData, manual_notes: e.target.value})}
              />
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-50">
               <Label className="text-xs font-black uppercase text-slate-400">Registro de Áudio</Label>
               <RadioGroup value={recordType} onValueChange={(v: any) => setRecordType(v)} className="flex flex-col md:flex-row gap-4">
                  <div className={cn("flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer", recordType === 'manual' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50')}>
                    <RadioGroupItem value="manual" id="m" className="sr-only" />
                    <Label htmlFor="m" className="flex items-center gap-3 cursor-pointer">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <div className="text-sm font-bold">Apenas Notas</div>
                    </Label>
                  </div>
                  <div className={cn("flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer", recordType === 'ambos' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50', tier === 'free' && 'opacity-50 grayscale')}>
                    <RadioGroupItem value="ambos" id="a" disabled={tier === 'free'} className="sr-only" />
                    <Label htmlFor="a" className="flex items-center gap-3 cursor-pointer">
                      <Mic className="h-5 w-5 text-indigo-500" />
                      <div className="text-sm font-bold">Áudio + Notas</div>
                    </Label>
                  </div>
               </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row justify-end gap-3">
          <Button type="button" variant="outline" className="rounded-2xl h-12 px-8" onClick={() => navigate(-1)} disabled={submitting}>Cancelar</Button>
          <Button type="button" variant="secondary" className="rounded-2xl h-12 px-8 font-bold" disabled={submitting} onClick={(e) => handleSave(e, false)}>
            {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />} Salvar Rascunho
          </Button>
          <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-12 px-10 font-black shadow-lg shadow-indigo-100" disabled={submitting} onClick={(e) => handleSave(e, true)}>
            {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <ClipboardCheck className="h-4 w-4 mr-2" />} Finalizar Sessão
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SessionFormPage;
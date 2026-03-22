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
import { cn, getLocalDateTime } from "@/lib/utils";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Autosave simplificado
  useEffect(() => {
    if (initialLoad.current) { initialLoad.current = false; return; }
    if (!id || loading) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaving(true);
    saveTimeout.current = setTimeout(async () => {
      try { await sessionService.update(id, { ...formData, record_type: recordType }); } 
      catch (e) { console.error(e); } finally { setSaving(false); }
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
    <div className="max-w-5xl mx-auto space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl font-black text-slate-900">{id ? "Editar Sessão" : "Novo Atendimento"}</h1>
            {saving && <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-400 animate-pulse"><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</div>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={(e) => handleSave(e, false)} disabled={submitting}>Salvar Rascunho</Button>
          <Button type="button" className="bg-indigo-600 h-10 rounded-xl font-black px-6 shadow-lg shadow-indigo-100" onClick={(e) => handleSave(e, true)} disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <ClipboardCheck className="h-4 w-4 mr-2" />} Finalizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal: Tipo e Áudio */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[28px] border-none shadow-sm overflow-hidden bg-white">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-indigo-600 border-b border-slate-50 pb-3">
                <Mic className="h-4 w-4" />
                <h3 className="font-black text-[10px] uppercase tracking-widest">Configuração da Sessão</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Tipo de Registro</Label>
                  <RadioGroup value={recordType} onValueChange={(v: any) => setRecordType(v)} className="flex gap-3">
                    <div className={cn("flex-1 p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center gap-2", recordType === 'manual' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100')}>
                      <RadioGroupItem value="manual" id="m" className="sr-only" />
                      <Label htmlFor="m" className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                        <FileText className="h-4 w-4 text-slate-400" /> Notas
                      </Label>
                    </div>
                    <div className={cn("flex-1 p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center gap-2", recordType === 'ambos' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100', tier === 'free' && 'opacity-50 grayscale')}>
                      <RadioGroupItem value="ambos" id="a" disabled={tier === 'free'} className="sr-only" />
                      <Label htmlFor="a" className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                        <Mic className="h-4 w-4 text-indigo-500" /> Áudio + Notas
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Arquivo de Áudio</Label>
                  {recordType === 'manual' ? (
                    <div className="h-12 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed text-[10px] font-bold text-slate-400 uppercase">
                      Áudio desativado para este tipo
                    </div>
                  ) : (
                    <div className="relative group">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="audio/*"
                        onChange={handleFileChange}
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        className={cn("w-full h-12 rounded-2xl border-dashed gap-2 text-xs font-bold", (audioFile || existingAudioName) && "border-indigo-300 bg-indigo-50 text-indigo-700")}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {audioFile ? (
                          <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {audioFile.name.substring(0, 20)}...</>
                        ) : existingAudioName ? (
                          <><Music className="h-4 w-4" /> {existingAudioName}</>
                        ) : (
                          <><Upload className="h-4 w-4" /> Selecionar Áudio</>
                        )}
                      </Button>
                      {(audioFile || existingAudioName) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setAudioFile(null); setExistingAudioName(null); }}
                          className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-none shadow-sm overflow-hidden bg-white">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-indigo-600 border-b border-slate-50 pb-3">
                <Stethoscope className="h-4 w-4" />
                <h3 className="font-black text-[10px] uppercase tracking-widest">Atendimento Clínico</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">Notas de Evolução e Sintomas</Label>
                  <Textarea 
                    placeholder="Evolução, sintomas, queixas..." 
                    className="min-h-[140px] rounded-2xl resize-none bg-slate-50/30 border-slate-100"
                    value={formData.clinical_notes}
                    onChange={(e) => setFormData({...formData, clinical_notes: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600">Intervenções Realizadas</Label>
                  <Textarea 
                    placeholder="Técnicas e manejo aplicado..." 
                    className="min-h-[140px] rounded-2xl resize-none bg-slate-50/30 border-slate-100"
                    value={formData.interventions}
                    onChange={(e) => setFormData({...formData, interventions: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">Resumo do Atendimento (Visão Consolidada)</Label>
                <Textarea 
                  placeholder="Resuma os pontos principais..." 
                  className="min-h-[80px] rounded-2xl resize-none bg-slate-50/30 border-slate-100"
                  value={formData.session_summary_manual}
                  onChange={(e) => setFormData({...formData, session_summary_manual: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">Anotações Livres / Rascunho</Label>
                <Textarea 
                  placeholder="Rascunho livre..." 
                  className="min-h-[100px] rounded-2xl resize-none bg-white border-slate-100"
                  value={formData.manual_notes}
                  onChange={(e) => setFormData({...formData, manual_notes: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Dados do Paciente */}
        <div className="space-y-6">
          <Card className="rounded-[28px] border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 pb-4">
              <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">Paciente</Label>
                <Select required value={formData.patient_id} onValueChange={(v) => setFormData({...formData, patient_id: v})} disabled={!!id}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">Data e Hora</Label>
                <Input 
                  type="datetime-local" 
                  className="rounded-xl h-10"
                  value={formData.session_date}
                  onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">Duração (minutos)</Label>
                <Input 
                  type="number" 
                  className="rounded-xl h-10"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                />
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-[28px] bg-indigo-600 text-white shadow-xl shadow-indigo-100 space-y-4">
             <div className="flex items-center gap-2">
               <Sparkles className="h-5 w-5" />
               <h4 className="font-black text-xs uppercase tracking-widest">Dica PsiAI</h4>
             </div>
             <p className="text-xs leading-relaxed opacity-90 font-medium">Ao finalizar a sessão com áudio, nossa inteligência processará automaticamente os insights, destaques e próximos passos para você.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionFormPage;
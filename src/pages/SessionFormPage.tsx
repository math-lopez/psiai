import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Save, Upload, Mic, FileText, Loader2, X, Music } from "lucide-react";
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

const SessionFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recordType, setRecordType] = useState<SessionRecordType>("ambos");
  
  const [formData, setFormData] = useState({
    patient_id: "",
    session_date: new Date().toISOString().slice(0, 16),
    duration_minutes: 50,
    manual_notes: "",
  });
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [existingAudioName, setExistingAudioName] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
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
            });
            setRecordType(session.record_type);
            setExistingAudioName(session.audio_file_name);
          }
        }
      } catch (e) {
        showError("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAudioFile(file);
    if (!validation.valid) {
      showError(validation.error!);
      e.target.value = '';
      return;
    }

    setAudioFile(file);
    setExistingAudioName(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (id) {
        await sessionService.update(id, {
          ...formData,
          record_type: recordType,
        }, audioFile || undefined);
        showSuccess("Sessão atualizada com sucesso!");
      } else {
        await sessionService.create({
          ...formData,
          record_type: recordType,
        }, audioFile || undefined);
        showSuccess("Sessão registrada com sucesso!");
      }
      navigate("/sessoes");
    } catch (error: any) {
      showError(error.message || "Erro ao salvar sessão");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-indigo-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{id ? "Editar Sessão" : "Nova Sessão"}</h1>
          <p className="text-slate-500">Gerencie os detalhes do atendimento e arquivos de áudio.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="patient">Paciente *</Label>
                <Select required value={formData.patient_id} onValueChange={(v) => setFormData({...formData, patient_id: v})} disabled={!!id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                onValueChange={(v: any) => setRecordType(v)}
              >
                <div className="flex items-center space-x-2 border p-4 rounded-lg flex-1 cursor-pointer">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" /> Apenas Anotações
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-4 rounded-lg flex-1 cursor-pointer">
                  <RadioGroupItem value="ambos" id="ambos" />
                  <Label htmlFor="ambos" className="flex items-center gap-2 cursor-pointer">
                    <Mic className="h-4 w-4" /> Áudio + Notas
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {(recordType === 'audio' || recordType === 'ambos') && (
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
                      accept="audio/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-11 px-8" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Enviando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {id ? "Salvar Alterações" : "Salvar Sessão"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SessionFormPage;
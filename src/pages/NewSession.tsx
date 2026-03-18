import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Save, Upload, Mic, FileText, Loader2 } from "lucide-react";
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
import { Patient } from "@/types";
import { showSuccess, showError } from "@/utils/toast";

const NewSession = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recordType, setRecordType] = useState("ambos");
  
  const [formData, setFormData] = useState({
    patient_id: "",
    session_date: new Date().toISOString().slice(0, 16),
    duration_minutes: 50,
    manual_notes: "",
  });
  
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    patientService.list().then(data => {
      setPatients(data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sessionService.create({
        ...formData,
        record_type: recordType,
      }, audioFile || undefined);
      
      showSuccess("Sessão registrada com sucesso!");
      navigate("/sessoes");
    } catch (error: any) {
      showError(error.message || "Erro ao registrar sessão");
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
          <h1 className="text-2xl font-bold text-slate-900">Nova Sessão</h1>
          <p className="text-slate-500">Registre os dados do atendimento atual.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="patient">Paciente *</Label>
                <Select required value={formData.patient_id} onValueChange={(v) => setFormData({...formData, patient_id: v})}>
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

            <div className="space-y-4 pt-4">
              <Label>Tipo de Registro</Label>
              <RadioGroup 
                value={recordType} 
                className="flex flex-col md:flex-row gap-4"
                onValueChange={setRecordType}
              >
                <div className="flex items-center space-x-2 border p-4 rounded-lg flex-1 cursor-pointer hover:border-indigo-500 transition-colors">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" /> Apenas Anotações
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-4 rounded-lg flex-1 cursor-pointer hover:border-indigo-500 transition-colors">
                  <RadioGroupItem value="audio" id="audio" />
                  <Label htmlFor="audio" className="flex items-center gap-2 cursor-pointer">
                    <Mic className="h-4 w-4" /> Apenas Áudio
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-4 rounded-lg flex-1 cursor-pointer hover:border-indigo-500 transition-colors">
                  <RadioGroupItem value="ambos" id="ambos" />
                  <Label htmlFor="ambos" className="flex items-center gap-2 cursor-pointer">
                    <Mic className="h-4 w-4" /> Áudio + Anotações
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {(recordType === 'audio' || recordType === 'ambos') && (
              <div className="space-y-4 pt-4 border-t">
                <Label className="flex items-center gap-2 text-indigo-600 font-semibold">
                  <Upload className="h-4 w-4" /> Upload de Áudio da Sessão
                </Label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="audio/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  />
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 text-center hover:bg-slate-50 transition-colors">
                    <p className="text-slate-500">
                      {audioFile ? audioFile.name : "Arraste o arquivo aqui ou clique para selecionar"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Formatos suportados: MP3, WAV, M4A (Max: 50MB)</p>
                  </div>
                </div>
              </div>
            )}

            {(recordType === 'manual' || recordType === 'ambos') && (
              <div className="space-y-4 pt-4 border-t">
                <Label className="font-semibold text-slate-700">Anotações do Psicólogo</Label>
                <Textarea 
                  placeholder="Escreva livremente sobre a sessão..." 
                  className="min-h-[250px] resize-none"
                  value={formData.manual_notes}
                  onChange={(e) => setFormData({...formData, manual_notes: e.target.value})}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
            Descartar Rascunho
          </Button>
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-11 px-8 font-semibold" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Salvar e Enviar para Processamento
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewSession;
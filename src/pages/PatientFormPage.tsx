import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/utils/toast";
import { patientService } from "@/services/patientService";
import { accessService } from "@/services/accessService";
import { maskCPF, maskPhone } from "@/lib/utils";

const PatientFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  
  const [formData, setFormData] = useState({
    full_name: "",
    birth_date: "",
    cpf: "",
    gender: "outro",
    email: "",
    phone: "",
    emergency_contact: "",
    notes: "",
    status: "ativo" as "ativo" | "inativo"
  });

  const [createAccess, setCreateAccess] = useState(true); // NOVO: Acesso automático

  useEffect(() => {
    if (id) {
      patientService.getById(id).then(data => {
        if (data) {
          setFormData({
            full_name: data.full_name || "",
            birth_date: data.birth_date || "",
            cpf: data.cpf || "",
            gender: data.gender || "outro",
            email: data.email || "",
            phone: data.phone || "",
            emergency_contact: data.emergency_contact || "",
            notes: data.notes || "",
            status: data.status || "ativo"
          });
        }
        setFetching(false);
      }).catch(() => {
        showError("Erro ao carregar dados do paciente.");
        navigate("/pacientes");
      });
    }
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (id) {
        await patientService.update(id, formData);
        showSuccess("Paciente atualizado com sucesso!");
      } else {
        const newPatient = await patientService.create(formData);
        
        // NOVO: Se marcado, cria o acesso automático com senha ALEATÓRIA
        if (createAccess && newPatient.id && newPatient.email) {
          try {
            // Chamando a ativação sem passar senha fixa, para que a Edge Function gere uma
            const generatedPassword = await accessService.activateDirectly(
              newPatient.id, 
              newPatient.email, 
              undefined, 
              newPatient.full_name
            );
            showSuccess(`Portal liberado! Senha inicial: ${generatedPassword}`);
          } catch (accessErr: any) {
            console.error("Erro ao criar acesso automático:", accessErr);
            showError("Paciente criado, mas erro ao liberar acesso automático.");
          }
        }
        
        showSuccess("Paciente cadastrado com sucesso!");
      }
      navigate("/pacientes");
    } catch (error: any) {
      showError(error.message || "Erro ao salvar paciente");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{id ? "Editar Paciente" : "Novo Paciente"}</h1>
          <p className="text-slate-500">Informações completas para o prontuário.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-semibold text-lg border-b pb-2">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input 
                  id="full_name" 
                  required 
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento *</Label>
                <Input 
                  id="birth_date" 
                  type="date" 
                  required 
                  value={formData.birth_date}
                  onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input 
                  id="cpf" 
                  value={formData.cpf}
                  placeholder="000.000.000-00"
                  onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select 
                  value={formData.gender}
                  onValueChange={(value) => setFormData({...formData, gender: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro / Prefiro não dizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <h3 className="font-semibold text-lg border-b pb-2 pt-4">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                <Input 
                  id="phone" 
                  required 
                  value={formData.phone}
                  placeholder="(00) 00000-0000"
                  onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})}
                />
              </div>
            </div>

            <h3 className="font-semibold text-lg border-b pb-2 pt-4">Observações</h3>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Gerais</Label>
              <Textarea 
                id="notes" 
                className="min-h-[120px]"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status do Paciente</Label>
              <Select 
                value={formData.status}
                onValueChange={(value: any) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!id && (
              <div className="flex items-center space-x-2 pt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <Checkbox 
                  id="create_access" 
                  checked={createAccess} 
                  onCheckedChange={(checked) => setCreateAccess(!!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="create_access" className="text-sm font-bold text-indigo-900 cursor-pointer">
                    Liberar acesso ao Portal do Paciente agora
                  </Label>
                  <p className="text-[10px] text-indigo-400 font-medium leading-relaxed">
                    O paciente receberá uma conta ativa. Uma senha segura será gerada e o e-mail de acesso enviado.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {id ? "Atualizar Paciente" : "Salvar Paciente"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PatientFormPage;
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Save } from "lucide-react";
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
import { showSuccess } from "@/utils/toast";

const PatientFormPage = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showSuccess("Paciente cadastrado com sucesso!");
    navigate("/pacientes");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Novo Paciente</h1>
          <p className="text-slate-500">Preencha as informações para o prontuário.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-semibold text-lg border-b pb-2">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input id="fullName" placeholder="Ex: João da Silva" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                <Input id="birthDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
                <Input id="email" type="email" placeholder="email@exemplo.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                <Input id="phone" placeholder="(00) 00000-0000" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="emergency">Contato de Emergência (Nome e Telefone)</Label>
                <Input id="emergency" placeholder="Ex: Maria Silva - (11) 98888-8888" />
              </div>
            </div>

            <h3 className="font-semibold text-lg border-b pb-2 pt-4">Observações Adicionais</h3>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Gerais</Label>
              <Textarea 
                id="notes" 
                placeholder="Informações relevantes sobre o paciente, queixas principais, etc." 
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status do Paciente</Label>
              <Select defaultValue="ativo">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Save className="h-4 w-4" /> Salvar Paciente
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PatientFormPage;
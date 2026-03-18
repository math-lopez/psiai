import { Save, User, Shield, CreditCard, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { mockUser } from "@/lib/mockData";
import { showSuccess } from "@/utils/toast";

const Settings = () => {
  const handleSave = () => {
    showSuccess("Configurações salvas!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500">Gerencie sua conta e preferências do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <nav className="space-y-1">
          <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700">
            <User className="h-4 w-4" /> Perfil
          </button>
          <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Shield className="h-4 w-4" /> Segurança
          </button>
          <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Bell className="h-4 w-4" /> Notificações
          </button>
          <button className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <CreditCard className="h-4 w-4" /> Assinatura
          </button>
        </nav>

        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Profissionais</CardTitle>
              <CardDescription>Informações exibidas em seus documentos e prontuários.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" defaultValue={mockUser.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crp">CRP</Label>
                  <Input id="crp" defaultValue={mockUser.crp} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail Profissional</Label>
                  <Input id="email" defaultValue={mockUser.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" defaultValue={mockUser.phone} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferências da IA</CardTitle>
              <CardDescription>Configure como o PsiAI deve processar suas sessões.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Transcrição Automática</Label>
                  <p className="text-sm text-slate-500">Processar áudio imediatamente após o upload.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between border-t pt-6">
                <div className="space-y-0.5">
                  <Label>Gerar Insights Terapêuticos</Label>
                  <p className="text-sm text-slate-500">Identificar automaticamente sentimentos e padrões.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between border-t pt-6">
                <div className="space-y-0.5">
                  <Label>Resumo para o Paciente</Label>
                  <p className="text-sm text-slate-500">Gerar sugestão de texto para enviar ao paciente pós-sessão.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={handleSave}>
              <Save className="h-4 w-4" /> Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
import { useState, useEffect } from "react";
import { Save, User, Shield, CreditCard, Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    crp: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.user_metadata?.full_name || "",
        crp: user.user_metadata?.crp || "",
        email: user.email || "",
        phone: user.user_metadata?.phone || ""
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Atualiza metadados no Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: profile.full_name,
          crp: profile.crp,
          phone: profile.phone
        }
      });

      if (authError) throw authError;

      // Atualiza tabela de profiles
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          crp: profile.crp,
          phone: profile.phone
        })
        .eq('id', user?.id);

      if (dbError) throw dbError;

      showSuccess("Configurações salvas com sucesso!");
    } catch (error: any) {
      showError(error.message || "Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
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
                  <Input 
                    id="name" 
                    value={profile.full_name} 
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crp">CRP</Label>
                  <Input 
                    id="crp" 
                    value={profile.crp} 
                    onChange={(e) => setProfile({...profile, crp: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail Profissional</Label>
                  <Input id="email" value={profile.email} disabled className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    value={profile.phone} 
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  />
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
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 gap-2" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
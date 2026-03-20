import { useState, useEffect } from "react";
import { Save, User, Shield, CreditCard, Bell, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "security" | "notifications" | "billing";

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(false);
  
  // Estados para Perfil
  const [profile, setProfile] = useState({
    full_name: "",
    crp: "",
    email: "",
    phone: ""
  });

  // Estados para Segurança
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [showPass, setShowPass] = useState(false);

  // Estados para Notificações
  const [notifs, setNotifs] = useState({
    emailSession: true,
    emailInsights: true,
    browserAlerts: false
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

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          full_name: profile.full_name,
          crp: profile.crp,
          phone: profile.phone
        }
      });
      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          crp: profile.crp,
          phone: profile.phone
        })
        .eq('id', user?.id);
      if (dbError) throw dbError;

      showSuccess("Perfil atualizado com sucesso!");
    } catch (error: any) {
      showError(error.message || "Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      showError("As senhas não coincidem.");
      return;
    }
    if (passwords.newPassword.length < 6) {
      showError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });
      if (error) throw error;
      showSuccess("Senha alterada com sucesso!");
      setPasswords({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      showError(error.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifs = () => {
    setLoading(true);
    setTimeout(() => {
      showSuccess("Preferências de notificação salvas!");
      setLoading(false);
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500">Gerencie sua conta e preferências do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <nav className="space-y-1">
          {[
            { id: "profile", label: "Perfil", icon: User },
            { id: "security", label: "Segurança", icon: Shield },
            { id: "notifications", label: "Notificações", icon: Bell },
            { id: "billing", label: "Assinatura", icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab.id 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </nav>

        <div className="md:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
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
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={handleSaveProfile} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar Perfil
                </Button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>Mantenha sua conta segura trocando sua senha periodicamente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 relative">
                    <Label htmlFor="new-pass">Nova Senha</Label>
                    <div className="relative">
                      <Input 
                        id="new-pass" 
                        type={showPass ? "text" : "password"} 
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                      />
                      <button 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        onClick={() => setShowPass(!showPass)}
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-pass">Confirmar Nova Senha</Label>
                    <Input 
                      id="confirm-pass" 
                      type={showPass ? "text" : "password"} 
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={handleChangePassword} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Atualizar Senha
                </Button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alertas de E-mail</CardTitle>
                  <CardDescription>Escolha quais notificações deseja receber em seu e-mail.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sessão Concluída</Label>
                      <p className="text-sm text-slate-500">Receber e-mail quando a IA terminar de transcrever.</p>
                    </div>
                    <Switch 
                      checked={notifs.emailSession} 
                      onCheckedChange={(v) => setNotifs({...notifs, emailSession: v})} 
                    />
                  </div>
                  <div className="flex items-center justify-between border-t pt-6">
                    <div className="space-y-0.5">
                      <Label>Insights Terapêuticos</Label>
                      <p className="text-sm text-slate-500">Resumo semanal de padrões identificados pela IA.</p>
                    </div>
                    <Switch 
                      checked={notifs.emailInsights} 
                      onCheckedChange={(v) => setNotifs({...notifs, emailInsights: v})} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notificações no Navegador</CardTitle>
                  <CardDescription>Alertas em tempo real enquanto você usa o sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas Push</Label>
                      <p className="text-sm text-slate-500">Notificações de sistema na área de trabalho.</p>
                    </div>
                    <Switch 
                      checked={notifs.browserAlerts} 
                      onCheckedChange={(v) => setNotifs({...notifs, browserAlerts: v})} 
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={handleSaveNotifs} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar Preferências
                </Button>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <Card>
              <CardHeader>
                <CardTitle>Plano Atual</CardTitle>
                <CardDescription>Você está no Plano Profissional (Mensal).</CardDescription>
              </CardHeader>
              <CardContent className="py-10 text-center">
                <p className="text-slate-500 italic">Módulo de faturamento em desenvolvimento.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
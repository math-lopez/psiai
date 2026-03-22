import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, User, Shield, CreditCard, Bell, Loader2, Lock, Eye, EyeOff, Sparkles, ArrowRight, Download, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { PLAN_LIMITS, SubscriptionTier } from "@/config/plans";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { diaryService } from "@/services/diaryService";

type SettingsTab = "profile" | "security" | "notifications" | "billing";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isPatient, setIsPatient] = useState(false);
  
  // Estados para Perfil
  const [profile, setProfile] = useState({
    full_name: "",
    crp: "",
    email: "",
    phone: "",
    subscription_tier: "free" as SubscriptionTier,
    stripe_customer_id: null as string | null
  });

  // Estados para Segurança
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        // Verifica se é paciente
        const context = await diaryService.getPatientContext();
        setIsPatient(!!context);

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data) {
          setProfile({
            full_name: data.full_name || user.user_metadata?.full_name || "",
            crp: data.crp || user.user_metadata?.crp || "",
            email: user.email || "",
            phone: data.phone || user.user_metadata?.phone || "",
            subscription_tier: data.subscription_tier as SubscriptionTier || "free",
            stripe_customer_id: data.stripe_customer_id
          });
        }
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (activeTab === "billing" && profile.stripe_customer_id && !isPatient) {
      fetchInvoices();
    }
  }, [activeTab, profile.stripe_customer_id, isPatient]);

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-history');
      if (error) throw error;
      setInvoices(data.invoices || []);
    } catch (e) {
      console.error("Erro ao buscar faturas:", e);
    } finally {
      setLoadingInvoices(false);
    }
  };

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

  const currentPlan = PLAN_LIMITS[profile.subscription_tier] || PLAN_LIMITS.free;

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "security", label: "Segurança", icon: Shield },
    { id: "notifications", label: "Notificações", icon: Bell },
    ...(!isPatient ? [{ id: "billing", label: "Assinatura", icon: CreditCard }] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500">Gerencie sua conta e preferências do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <nav className="space-y-1">
          {tabs.map((tab) => (
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
                  <CardTitle>Dados Pessoais</CardTitle>
                  <CardDescription>Informações da sua conta no sistema.</CardDescription>
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
                    {!isPatient && (
                      <div className="space-y-2">
                        <Label htmlFor="crp">CRP</Label>
                        <Input 
                          id="crp" 
                          value={profile.crp} 
                          onChange={(e) => setProfile({...profile, crp: e.target.value})}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
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

              {!isPatient && (
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
              )}
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

          {activeTab === "billing" && !isPatient && (
            <div className="space-y-6">
              <Card className="overflow-hidden">
                <div className="h-2 bg-indigo-600 w-full" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Plano Atual</CardTitle>
                      <CardDescription>Gerencie sua assinatura e limites.</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      {currentPlan.name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl bg-slate-50 border space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Limite de Pacientes</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {currentPlan.maxPatients === Infinity ? 'Ilimitado' : currentPlan.maxPatients}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transcrições / Mês</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {currentPlan.maxTranscriptionsPerMonth === Infinity ? 'Ilimitadas' : currentPlan.maxTranscriptionsPerMonth}
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Sparkles className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-indigo-900">Gestão de Assinatura</h4>
                        <p className="text-sm text-indigo-700">Acesse o portal para faturas, cancelamentos e upgrades.</p>
                      </div>
                    </div>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                      onClick={() => navigate("/assinatura")}
                    >
                      Gerenciar <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos</CardTitle>
                  <CardDescription>Consulte e baixe suas faturas processadas pelo Stripe.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingInvoices ? (
                    <div className="py-10 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                  ) : invoices.length > 0 ? (
                    <div className="space-y-4">
                      {invoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{inv.number}</p>
                              <p className="text-xs text-slate-500">{format(new Date(inv.date * 1000), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-900">R$ {inv.amount.toFixed(2).replace('.', ',')}</p>
                              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{inv.status}</p>
                            </div>
                            {inv.pdf_url && (
                              <a 
                                href={inv.pdf_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                                title="Baixar PDF"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center flex flex-col items-center gap-3">
                       <FileText className="h-8 w-8 text-slate-200" />
                       <p className="text-sm text-slate-500 italic">Nenhuma fatura encontrada.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
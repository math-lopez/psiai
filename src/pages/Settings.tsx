import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, User, Shield, CreditCard, Bell, Loader2, Lock, Eye, EyeOff, Sparkles, ArrowRight, Download, FileText, CheckCircle2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { PLAN_LIMITS, SubscriptionTier } from "@/config/plans";
import { TherapeuticApproach } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type SettingsTab = "profile" | "security" | "notifications" | "billing";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  
  // Estados para Perfil
  const [profile, setProfile] = useState({
    full_name: "",
    crp: "",
    email: "",
    phone: "",
    therapeutic_approach: "TCC" as TherapeuticApproach,
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
            therapeutic_approach: (data.therapeutic_approach as TherapeuticApproach) || "TCC",
            subscription_tier: data.subscription_tier as SubscriptionTier || "free",
            stripe_customer_id: data.stripe_customer_id
          });
        }
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (activeTab === "billing" && profile.stripe_customer_id) {
      fetchInvoices();
    }
  }, [activeTab, profile.stripe_customer_id]);

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
          phone: profile.phone,
          therapeutic_approach: profile.therapeutic_approach
        }
      });
      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          crp: profile.crp,
          phone: profile.phone,
          therapeutic_approach: profile.therapeutic_approach
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
              <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-bold">Dados Profissionais</CardTitle>
                  <CardDescription>Informações exibidas em seus documentos e prontuários.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-black uppercase text-slate-400">Nome Completo</Label>
                      <Input 
                        id="name" 
                        value={profile.full_name} 
                        className="h-12 rounded-2xl"
                        onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="crp" className="text-xs font-black uppercase text-slate-400">CRP</Label>
                      <Input 
                        id="crp" 
                        value={profile.crp} 
                        className="h-12 rounded-2xl"
                        onChange={(e) => setProfile({...profile, crp: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-black uppercase text-slate-400">E-mail Profissional</Label>
                      <Input id="email" value={profile.email} disabled className="bg-slate-50 h-12 rounded-2xl text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-black uppercase text-slate-400">Telefone</Label>
                      <Input 
                        id="phone" 
                        value={profile.phone} 
                        className="h-12 rounded-2xl"
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-3 pt-4">
                      <Label className="text-xs font-black uppercase text-indigo-500 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" /> Abordagem Terapêutica Dominante
                      </Label>
                      <Select 
                        value={profile.therapeutic_approach} 
                        onValueChange={(v: TherapeuticApproach) => setProfile({...profile, therapeutic_approach: v})}
                      >
                        <SelectTrigger className="h-14 rounded-2xl border-indigo-100 font-bold text-slate-700 bg-indigo-50/30">
                          <SelectValue placeholder="Selecione sua abordagem" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="TCC" className="font-bold py-3">Terapia Cognitivo-Comportamental (TCC)</SelectItem>
                          <SelectItem value="PSICANALISE" className="font-bold py-3">Psicanálise / Orientação Analítica</SelectItem>
                          <SelectItem value="HUMANISTA" className="font-bold py-3">Fenomenologia / Humanista / Gestalt</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-400 font-medium">
                        * Mudar a abordagem altera quais módulos (Diário, Planos) ficam visíveis no prontuário para simplificar seu fluxo de trabalho.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-bold">Preferências da IA</CardTitle>
                  <CardDescription>Configure como o PsiAI deve processar suas sessões.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-0.5">
                      <Label className="font-bold">Transcrição Automática</Label>
                      <p className="text-xs text-slate-500">Processar áudio imediatamente após o upload.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end pt-4">
                <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-10 font-black shadow-xl shadow-indigo-100 gap-2" onClick={handleSaveProfile} disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-bold">Alterar Senha</CardTitle>
                  <CardDescription>Mantenha sua conta segura trocando sua senha periodicamente.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-4">
                  <div className="space-y-2 relative">
                    <Label htmlFor="new-pass" className="text-xs font-black uppercase text-slate-400">Nova Senha</Label>
                    <div className="relative">
                      <Input 
                        id="new-pass" 
                        type={showPass ? "text" : "password"} 
                        className="h-12 rounded-2xl"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                      />
                      <button 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                        onClick={() => setShowPass(!showPass)}
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-pass" className="text-xs font-black uppercase text-slate-400">Confirmar Nova Senha</Label>
                    <Input 
                      id="confirm-pass" 
                      type={showPass ? "text" : "password"} 
                      className="h-12 rounded-2xl"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end pt-4">
                <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 px-10 font-black shadow-xl shadow-indigo-100 gap-2" onClick={handleChangePassword} disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                  Atualizar Senha
                </Button>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <Card className="overflow-hidden rounded-[32px] border-none shadow-sm bg-white">
                <div className="h-2 bg-indigo-600 w-full" />
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold">Plano Atual</CardTitle>
                      <CardDescription>Gerencie sua assinatura e limites.</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1 font-bold">
                      {currentPlan.name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-slate-50 border space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Limite de Pacientes</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">
                        {currentPlan.maxPatients === Infinity ? 'Ilimitado' : currentPlan.maxPatients}
                      </p>
                    </div>
                    <div className="p-6 rounded-3xl bg-slate-50 border space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Transcrições / Mês</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tight">
                        {currentPlan.maxTranscriptionsPerMonth === Infinity ? 'Ilimitadas' : currentPlan.maxTranscriptionsPerMonth}
                      </p>
                    </div>
                  </div>

                  <div className="bg-indigo-600 p-8 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 text-white shadow-xl shadow-indigo-100">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <Sparkles className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-lg">Portal Financeiro</h4>
                        <p className="text-xs text-indigo-100 font-medium">Acesse o Stripe para faturas e cancelamentos.</p>
                      </div>
                    </div>
                    <Button 
                      className="bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-2xl h-12 px-8 gap-2 w-full md:w-auto"
                      onClick={() => navigate("/assinatura")}
                    >
                      Gerenciar Plano <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-bold">Histórico de Pagamentos</CardTitle>
                  <CardDescription>Consulte e baixe suas faturas processadas.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  {loadingInvoices ? (
                    <div className="py-10 flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                  ) : invoices.length > 0 ? (
                    <div className="space-y-4">
                      {invoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-indigo-100 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{inv.number}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{format(new Date(inv.date * 1000), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm font-black text-slate-900">R$ {inv.amount.toFixed(2).replace('.', ',')}</p>
                              <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase px-2">{inv.status}</Badge>
                            </div>
                            {inv.pdf_url && (
                              <a 
                                href={inv.pdf_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Baixar PDF"
                              >
                                <Download className="h-5 w-5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center flex flex-col items-center gap-4 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-100">
                       <FileText className="h-12 w-12 text-slate-200" />
                       <p className="text-sm text-slate-400 font-medium italic">Nenhuma fatura encontrada no histórico.</p>
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
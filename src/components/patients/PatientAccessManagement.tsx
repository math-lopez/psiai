"use client";

import React, { useState, useEffect } from "react";
import { AccessStatus, PatientAccess } from "@/types/access";
import { accessService } from "@/services/accessService";
import { 
  ShieldCheck, 
  UserPlus, 
  UserMinus, 
  Clock, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  Copy,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PatientAccessManagementProps {
  patientId: string;
  patientEmail: string;
}

export const PatientAccessManagement = ({ patientId, patientEmail }: PatientAccessManagementProps) => {
  const [access, setAccess] = useState<PatientAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchAccess = async () => {
    try {
      const data = await accessService.getAccessByPatientId(patientId);
      setAccess(data);
    } catch (e) {
      console.error("Erro ao buscar acesso:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccess();
  }, [patientId]);

  const handleInvite = async () => {
    setSubmitting(true);
    try {
      await accessService.createInvite(patientId);
      showSuccess("Convite gerado com sucesso!");
      fetchAccess();
    } catch (e) {
      showError("Erro ao gerar convite.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm("Tem certeza que deseja revogar o acesso deste paciente? Ele não poderá mais visualizar conteúdos compartilhados.")) return;
    setSubmitting(true);
    try {
      await accessService.revokeAccess(patientId);
      showSuccess("Acesso revogado.");
      fetchAccess();
    } catch (e) {
      showError("Erro ao revogar acesso.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyInviteLink = () => {
    if (!access?.invite_token) return;
    const link = `${window.location.origin}/portal/ativar?token=${access.invite_token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    showSuccess("Link de convite copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;

  const statusMap: Record<AccessStatus, { label: string; color: string; icon: any }> = {
    inactive: { label: "Sem Acesso", color: "bg-slate-100 text-slate-500", icon: AlertCircle },
    invited: { label: "Convite Pendente", color: "bg-amber-100 text-amber-700", icon: Clock },
    active: { label: "Acesso Ativo", color: "bg-emerald-100 text-emerald-700", icon: ShieldCheck },
    suspended: { label: "Acesso Suspenso", color: "bg-red-100 text-red-700", icon: UserMinus },
  };

  const currentStatus = access?.status || 'inactive';
  const config = statusMap[currentStatus];

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
        <div className={cn("h-1.5 w-full", 
          currentStatus === 'active' ? 'bg-emerald-500' : 
          currentStatus === 'invited' ? 'bg-amber-500' : 
          currentStatus === 'suspended' ? 'bg-red-500' : 'bg-slate-200'
        )} />
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" /> Controle de Acesso do Paciente
            </CardTitle>
            <Badge className={cn("px-3 py-1 border-none text-[10px] font-black uppercase tracking-widest", config.color)}>
              <config.icon className="h-3 w-3 mr-1.5" /> {config.label}
            </Badge>
          </div>
          <CardDescription className="text-slate-500 font-medium max-w-2xl">
            Gerencie como seu paciente interage com o sistema. Ao liberar o acesso, o paciente poderá ver registros compartilhados e responder tarefas entre sessões.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {currentStatus === 'inactive' || currentStatus === 'suspended' ? (
            <div className="bg-slate-50 rounded-3xl p-8 text-center border border-dashed border-slate-200">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                <UserPlus className="h-8 w-8" />
              </div>
              <h4 className="font-bold text-slate-900 mb-2">Liberar o Portal do Paciente</h4>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                Um convite será gerado para o e-mail <strong>{patientEmail}</strong>. O paciente precisará definir uma senha para acessar.
              </p>
              <Button 
                onClick={handleInvite} 
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-12 px-8 font-black shadow-lg shadow-indigo-100 gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Gerar Link de Convite
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Clock className="h-3 w-3" /> Histórico de Atividade
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700">
                      Convidado em: <span className="text-slate-900">{access?.invited_at ? format(new Date(access.invited_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}</span>
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      Último acesso: <span className="text-slate-900">{access?.last_access_at ? format(new Date(access.last_access_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Nunca acessou'}</span>
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 space-y-4">
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                    <ExternalLink className="h-3 w-3" /> Link de Acesso
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-indigo-100 rounded-xl px-4 py-2 text-xs font-mono text-indigo-600 truncate">
                      {access?.invite_token ? `${window.location.origin}/portal/ativar?token=...` : 'Gerando...'}
                    </div>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="bg-white hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-xl shrink-0"
                      onClick={copyInviteLink}
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  variant="ghost" 
                  onClick={handleRevoke}
                  disabled={submitting}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold rounded-2xl h-12 gap-2"
                >
                  <UserMinus className="h-4 w-4" /> Revogar Acesso Permanentemente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-[32px] bg-slate-900 text-white overflow-hidden">
        <CardContent className="p-8 flex items-start gap-6">
          <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white">Sobre a Área do Paciente</h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              Ao habilitar este recurso, o paciente terá acesso a um ambiente restrito onde poderá responder seus registros de humor, pensamentos e tarefas de casa. 
              <strong> Suas notas clínicas e transcrições internas NUNCA são compartilhadas.</strong> 
              O paciente verá apenas o que você marcar explicitamente com a visibilidade "Compartilhado".
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
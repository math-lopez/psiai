"use client";

import React, { useState, useEffect } from "react";
import { accessService } from "@/services/accessService";
import { PatientAccess } from "@/types/access";
import { 
  ShieldCheck, UserPlus, UserMinus, Clock, ExternalLink, Loader2, AlertCircle, Copy, CheckCircle2, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const PatientAccessManagement = ({ patientId, patientEmail }: { patientId: string; patientEmail: string }) => {
  const [access, setAccess] = useState<PatientAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchAccess = async () => {
    try {
      const data = await accessService.getAccessByPatientId(patientId);
      setAccess(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAccess(); }, [patientId]);

  const handleInvite = async () => {
    setSubmitting(true);
    try {
      await accessService.createInvite(patientId);
      showSuccess("Convite gerado!");
      fetchAccess();
    } catch (e) { showError("Erro ao gerar convite."); } finally { setSubmitting(false); }
  };

  const copyInviteLink = () => {
    if (!access?.invite_token) return;
    const link = `${window.location.origin}/portal/ativar?token=${access.invite_token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    showSuccess("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;

  const currentStatus = access?.status || 'inactive';

  return (
    <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white mt-6">
      <div className={cn("h-1.5 w-full", currentStatus === 'active' ? 'bg-emerald-500' : currentStatus === 'invited' ? 'bg-amber-500' : 'bg-slate-200')} />
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-500" /> Acesso ao Portal do Paciente
          </CardTitle>
          <Badge className={cn("px-3 py-1 border-none text-[10px] font-black uppercase tracking-widest", 
            currentStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 
            currentStatus === 'invited' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
          )}>
            {currentStatus === 'active' ? 'Ativo' : currentStatus === 'invited' ? 'Pendente' : 'Sem Acesso'}
          </Badge>
        </div>
        <CardDescription className="mt-2 font-medium">Controle o que o paciente pode visualizar e registrar no portal dele.</CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        {currentStatus === 'inactive' ? (
          <div className="bg-slate-50 rounded-3xl p-8 text-center border border-dashed border-slate-200">
            <UserPlus className="h-10 w-10 text-slate-300 mx-auto mb-4" />
            <h4 className="font-bold mb-2">Habilitar Portal</h4>
            <p className="text-sm text-slate-500 mb-6">O paciente receberá um convite para o e-mail {patientEmail}.</p>
            <Button onClick={handleInvite} disabled={submitting} className="bg-indigo-600 rounded-2xl h-12 px-8 font-black">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar Convite"}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Atividade</p>
              <p className="text-sm font-bold">Último acesso: <span className="text-slate-500 font-medium">{access?.last_access_at ? format(new Date(access.last_access_at), "dd/MM/yyyy", { locale: ptBR }) : 'Nunca'}</span></p>
            </div>
            <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 space-y-3">
              <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Status do Link</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-indigo-100 rounded-xl px-4 py-2 text-xs font-mono text-indigo-600 truncate">
                  {currentStatus === 'active' ? 'Conta já ativada' : access?.invite_token ? `${window.location.origin}/portal/ativar?token=${access.invite_token}` : 'Gerando...'}
                </div>
                {currentStatus === 'invited' && access?.invite_token && (
                  <Button variant="secondary" size="icon" className="bg-white rounded-xl" onClick={copyInviteLink}>
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
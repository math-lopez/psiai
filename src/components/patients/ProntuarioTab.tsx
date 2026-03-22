"use client";

import React from "react";
import { Patient, Session } from "@/types";
import { FileText, Download, ShieldCheck, ClipboardList, Stethoscope, History, Zap, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProntuarioTabProps {
  patient: Patient;
  sessions: Session[];
}

export const ProntuarioTab = ({ patient, sessions }: ProntuarioTabProps) => {
  const handleExport = () => {
    window.print(); // Solução simples para o MVP: imprimir/salvar como PDF
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 print:hidden">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Prontuário Eletrônico</h3>
          <p className="text-sm text-slate-500">Histórico clínico consolidado e documentos do paciente.</p>
        </div>
        <Button onClick={handleExport} className="bg-indigo-600 h-12 px-8 rounded-2xl font-black gap-2 shadow-lg shadow-indigo-100">
          <Download className="h-5 w-5" /> Exportar Prontuário (PDF)
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Identificação do Paciente */}
        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Identificação e Dados Cadastrais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome Completo</p>
              <p className="font-bold text-slate-900 dark:text-white">{patient.full_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Data de Nascimento</p>
              <p className="font-bold text-slate-900 dark:text-white">{format(new Date(patient.birth_date), "dd/MM/yyyy")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">CPF</p>
              <p className="font-bold text-slate-900 dark:text-white">{patient.cpf || "Não informado"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">E-mail</p>
              <p className="font-bold text-slate-900 dark:text-white">{patient.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Resumo da Evolução */}
        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <History className="h-4 w-4" /> Evolução do Tratamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-indigo-500" /> Queixa Principal e Observações Gerais
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl italic">
                {patient.notes || "Sem notas de evolução inicial registradas."}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-indigo-500" /> Resumo Consolidado das Últimas Sessões
              </h4>
              <div className="space-y-4">
                {sessions.length > 0 ? sessions.slice(0, 5).map((session, idx) => (
                  <div key={session.id} className="p-6 rounded-3xl border border-slate-50 dark:border-slate-800 hover:border-indigo-100 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">
                        {format(new Date(session.session_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">{session.duration_minutes} min</Badge>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {session.session_summary_manual || session.clinical_notes || "Sessão sem resumo clínico detalhado."}
                    </p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400 italic">Nenhuma sessão registrada para este prontuário.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
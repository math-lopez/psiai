"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Patient, Session } from "@/types";
import { 
  FileText, Download, ShieldCheck, ClipboardList, Stethoscope, 
  History, Zap, Sparkles, ChevronDown, ChevronUp, ExternalLink,
  Clock, MessageSquare, Calendar, Edit3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProntuarioTabProps {
  patient: Patient;
  sessions: Session[];
}

export const ProntuarioTab = ({ patient, sessions }: ProntuarioTabProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleExport = () => {
    window.print(); 
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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

            <div className="space-y-6">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-indigo-500" /> Histórico de Atendimentos
              </h4>
              
              <div className="space-y-4">
                {sessions.length > 0 ? sessions.map((session) => {
                  const isExpanded = expandedId === session.id;
                  
                  return (
                    <div 
                      key={session.id} 
                      className={cn(
                        "rounded-[28px] border transition-all duration-300 overflow-hidden",
                        isExpanded 
                          ? "border-indigo-200 bg-indigo-50/20 dark:border-indigo-900/40 dark:bg-indigo-900/5 shadow-md" 
                          : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-200"
                      )}
                    >
                      {/* Header da Sessão */}
                      <div 
                        onClick={() => toggleExpand(session.id)}
                        className="p-6 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                            isExpanded ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          )}>
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                              {format(new Date(session.session_date), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              Sessão de {session.duration_minutes} minutos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {!isExpanded && (
                            <p className="text-xs text-slate-400 font-medium hidden md:block max-w-xs truncate">
                              {session.session_summary_manual || "Ver detalhes..."}
                            </p>
                          )}
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                        </div>
                      </div>

                      {/* Conteúdo Expansível */}
                      {isExpanded && (
                        <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-indigo-100 dark:border-indigo-900/30">
                            <div className="space-y-3">
                              <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                                <MessageSquare className="h-3 w-3" /> Resumo Consolidado
                              </h5>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                {session.session_summary_manual || "Não preenchido."}
                              </p>
                            </div>
                            
                            <div className="space-y-3">
                              <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                                <Zap className="h-3 w-3" /> Intervenções
                              </h5>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                {session.interventions || "Não preenchido."}
                              </p>
                            </div>

                            <div className="space-y-3">
                              <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                                <FileText className="h-3 w-3" /> Evolução Clínica
                              </h5>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                                {session.clinical_notes || "Nenhuma nota detalhada."}
                              </p>
                            </div>

                            <div className="space-y-3">
                              <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Edit3 className="h-3 w-3" /> Rascunho Livre / Notas Manuais
                              </h5>
                              <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed whitespace-pre-wrap italic">
                                {session.manual_notes || "Sem notas manuais registradas."}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-end pt-2">
                            <Link to={`/sessoes/${session.id}`}>
                              <Button variant="outline" size="sm" className="rounded-xl h-10 px-6 gap-2 font-bold text-indigo-600 border-indigo-100 hover:bg-indigo-50">
                                <ExternalLink className="h-4 w-4" /> Ver Sessão Completa
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-400 italic">Nenhum atendimento registrado.</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
"use client";

import React from "react";
import { Session } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, Calendar, ArrowRight, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LatestSessionFeatureProps {
  session: Session | null;
}

export const LatestSessionFeature = ({ session }: LatestSessionFeatureProps) => {
  if (!session) return null;

  const highlights = session.highlights?.slice(0, 2) || [];
  const transcriptPreview = session.transcript 
    ? session.transcript.slice(0, 180) + "..."
    : "Sem transcrição disponível.";

  return (
    <Card className="border-none shadow-xl shadow-indigo-100/50 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-[40px] overflow-hidden">
      <CardContent className="p-8 md:p-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Última Sessão Realizada</p>
                <p className="text-xl font-bold">
                  {format(new Date(session.session_date), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-200 tracking-wider">
                <FileText className="h-3 w-3" /> Resumo da Transcrição
              </div>
              <p className="text-sm text-indigo-50 leading-relaxed font-medium">
                {transcriptPreview}
              </p>
            </div>

            <Link to={`/sessoes/${session.id}`}>
              <Button className="mt-4 bg-white text-indigo-700 hover:bg-indigo-50 rounded-2xl px-6 font-black gap-2 h-12">
                Ver Detalhes da Sessão <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="lg:w-1/3 bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10 space-y-5">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-200 tracking-wider">
              <Sparkles className="h-4 w-4" /> Principais Destaques
            </div>
            {highlights.length > 0 ? (
              <ul className="space-y-4">
                {highlights.map((h, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                    <span className="text-xs font-bold leading-snug">{h}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-indigo-200 italic">Processando destaques clínicos...</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
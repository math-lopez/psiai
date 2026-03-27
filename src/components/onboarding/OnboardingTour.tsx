"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, Sparkles, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Step {
  id: number;
  target: string;
  title?: string;
  content: string;
  route?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: Step[] = [
  { 
    id: 1, 
    target: '[data-tour="sidebar"]', 
    title: "Bem-vindo ao PsiAI!",
    content: "Este é o seu painel de controle. Tudo que você precisa para gerenciar sua prática clínica está aqui no menu lateral.",
    route: "/dashboard",
    position: 'right'
  },
  { 
    id: 2, 
    target: '[data-tour="menu-patients"]', 
    content: "Em Pacientes você centraliza toda a sua carteira de clientes. Cadastre novos pacientes e acesse o histórico completo de cada um.",
    route: "/dashboard",
    position: 'right'
  },
  { 
    id: 3, 
    target: '[data-tour="add-patient-btn"]', 
    content: "Clique aqui para adicionar um novo paciente. Você vai informar os dados de contato e ele já fica disponível para atendimento.",
    route: "/pacientes",
    position: 'bottom'
  },
  { 
    id: 4, 
    target: '[data-tour="search-patients"]', 
    content: "Use a busca para encontrar qualquer paciente rapidamente pelo nome, e-mail ou telefone.",
    route: "/pacientes",
    position: 'bottom'
  },
  { 
    id: 5, 
    target: '[data-tour="latest-session-card"]', 
    content: "Ao entrar no perfil de um paciente, você vê imediatamente o resumo da última sessão realizada e os principais destaques clínicos gerados pela IA.",
    route: "PICK_PATIENT",
    position: 'bottom'
  },
  { 
    id: 6, 
    target: '[data-tour="patient-tabs-list"]', 
    content: "O perfil do paciente é dividido em abas. Cada uma concentra um tipo de informação clínica diferente. Explore cada uma delas.",
    position: 'bottom'
  },
  { id: 7, target: '[data-tour="tab-overview"]', content: "A Visão Geral mostra a linha do tempo de todas as sessões do paciente em ordem cronológica, com acesso rápido a cada atendimento.", position: 'bottom' },
  { id: 8, target: '[data-tour="tab-treatment"]', content: "Em Plano você cria e acompanha o plano terapêutico do paciente, definindo objetivos e monitorando a evolução ao longo do tratamento.", position: 'bottom' },
  { id: 9, target: '[data-tour="tab-diary"]', content: "O Diário registra o que acontece entre as sessões. Você pode acompanhar padrões de comportamento do paciente.", position: 'bottom' },
  { id: 10, target: '[data-tour="tab-documents"]', content: "Em Documentos você anexa laudos, relatórios e qualquer arquivo relevante diretamente no perfil do paciente.", position: 'bottom' },
  { id: 11, target: '[data-tour="tab-analysis"]', content: "Em Parecer você elabora e consulta os pareceres clínicos do paciente.", position: 'bottom' },
  { id: 12, target: '[data-tour="tab-access"]', content: "Em Acesso você controla as permissões e o vínculo do paciente com o sistema.", position: 'bottom' },
  { 
    id: 13, 
    target: '[data-tour="menu-sessions"]', 
    content: "Em Sessões você registra e visualiza todos os atendimentos realizados, com histórico completo e transcrições.",
    route: "/sessoes",
    position: 'right'
  },
  { 
    id: 14, 
    target: '[data-tour="menu-settings"]', 
    content: "Em Configurações você personaliza seu perfil, gerencia seus dados profissionais e escolhe ou altera seu plano.",
    route: "/configuracoes",
    position: 'right'
  },
  { 
    id: 15, 
    target: 'none', 
    title: "Tudo pronto!",
    content: "O PsiAI foi feito para simplificar sua rotina clínica e deixar mais tempo para o que importa: seus pacientes. Bom trabalho!",
    position: 'center'
  }
];

export const OnboardingTour = () => {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const currentStep = TOUR_STEPS[stepIndex];

  useEffect(() => {
    const checkTourStatus = async () => {
      // Fallback: Verifica no localStorage primeiro para ser instantâneo e evitar erro de coluna ausente
      const localCompleted = localStorage.getItem("psiai_onboarding_completed");
      if (localCompleted === "true") return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, crp')
          .eq('id', user.id)
          .maybeSingle();

        // Se o campo não existir no banco, profile.onboarding_completed virá undefined/null
        // Só ativa se for psicólogo e não completou
        if (profile && profile.crp && !profile.onboarding_completed) {
          setActive(true);
        }
      } catch (err) {
        // Se der erro de coluna ausente no banco, ativamos o tour se não estiver no localStorage
        console.warn("Coluna onboarding_completed não encontrada. Usando localStorage.");
        setActive(true);
      }
    };
    checkTourStatus();
  }, []);

  const updateRect = useCallback(() => {
    if (currentStep.target === 'none') {
      setRect(null);
      return;
    }
    const el = document.querySelector(currentStep.target);
    if (el) {
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [currentStep.target]);

  useEffect(() => {
    if (!active) return;
    
    const timer = setTimeout(updateRect, 500); 
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [active, stepIndex, updateRect, location.pathname]);

  const handleNext = async () => {
    if (stepIndex === TOUR_STEPS.length - 1) {
      await finishTour();
      return;
    }

    const nextStep = TOUR_STEPS[stepIndex + 1];
    
    if (nextStep.route) {
      if (nextStep.route === 'PICK_PATIENT') {
        const { data: patients } = await supabase.from('patients').select('id').limit(1);
        if (patients && patients.length > 0) {
          navigate(`/pacientes/${patients[0].id}`);
        } else {
          setStepIndex(12); 
          return;
        }
      } else {
        navigate(nextStep.route);
      }
    }
    
    setStepIndex(stepIndex + 1);
  };

  const handleSkip = async () => {
    await finishTour();
  };

  const finishTour = async () => {
    setActive(false);
    localStorage.setItem("psiai_onboarding_completed", "true");
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Tenta atualizar no banco, mas ignora silenciosamente se a coluna não existir
      try {
        await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
      } catch (e) {
        console.info("Não foi possível persistir no banco (coluna ausente), mas salvamos localmente.");
      }
    }
  };

  if (!active) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-all duration-500 pointer-events-auto" />

      {rect && (
        <div 
          className="absolute border-[4px] border-indigo-400 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.6)] transition-all duration-300 pointer-events-none"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16
          }}
        />
      )}

      <div 
        className={cn(
          "absolute pointer-events-auto bg-white rounded-[32px] shadow-2xl p-8 max-w-sm w-full transition-all duration-500 transform",
          currentStep.position === 'center' ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-110" : 
          rect ? "" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        style={rect ? {
          top: currentStep.position === 'bottom' ? rect.bottom + 24 : 
               currentStep.position === 'top' ? rect.top - 280 : 
               currentStep.position === 'right' ? rect.top : '50%',
          left: currentStep.position === 'right' ? rect.right + 24 : 
                currentStep.position === 'left' ? rect.left - 400 : 
                Math.max(24, Math.min(window.innerWidth - 400, rect.left))
        } : {}}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tutorial Interativo</span>
            </div>
            <button onClick={handleSkip} className="text-slate-300 hover:text-slate-500 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3">
            {currentStep.title && (
              <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {currentStep.id === 15 && <BrainCircuit className="h-6 w-6 text-indigo-600" />}
                {currentStep.title}
              </h4>
            )}
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {currentStep.content}
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-50">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Progresso</span>
              <span className="text-sm font-bold text-indigo-600">Passo {currentStep.id} de 15</span>
            </div>
            
            <div className="flex items-center gap-3">
              {currentStep.id < 15 && (
                <button onClick={handleSkip} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">
                  Pular Tour
                </button>
              )}
              <Button 
                onClick={handleNext} 
                className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-12 px-6 font-black shadow-lg shadow-indigo-100 gap-2"
              >
                {currentStep.id === 15 ? "Começar a usar" : "Avançar"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
"use client";

import React, { useState, useEffect } from "react";
import { TreatmentPlan, TreatmentGoal, GoalStatus } from "@/types/treatment";
import { treatmentService } from "@/services/treatmentService";
import {
  Target,
  Plus,
  Loader2,
  ClipboardList,
  ChevronRight,
  History,
  CheckCircle2,
  TrendingUp,
  LayoutDashboard,
  Calendar,
  Edit2,
  Eye,
  AlertTriangle,
  Sparkles,
  XCircle,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GoalItem } from "./GoalItem";
import { showError, showSuccess } from "@/utils/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Sub-componentes Locais para Modularidade ---

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none", className)}>
    {children}
  </span>
);

const PlanProgress = ({ completed, total }: { completed: number, total: number }) => {
  const progressValue = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="space-y-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-100/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Progresso Terapêutico</span>
        </div>
        <span className="text-sm font-black text-indigo-600">{Math.round(progressValue)}%</span>
      </div>
      <Progress value={progressValue} className="h-2.5 bg-slate-200" />
      <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
        {completed} de {total} objetivos concluídos
      </p>
    </div>
  );
};

// --- Componente Principal ---

interface TreatmentPlanModuleProps {
  patientId: string;
}

export const TreatmentPlanModule = ({ patientId }: TreatmentPlanModuleProps) => {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<TreatmentPlan | null>(null);
  
  // Modais e Estados de Edição
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [viewingHistoryPlan, setViewingHistoryPlan] = useState<TreatmentPlan | null>(null);
  const [editingGoal, setEditingGoal] = useState<TreatmentGoal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [planForm, setPlanForm] = useState({ title: '', description: '' });
  const [goalForm, setGoalForm] = useState({ title: '', description: '', priority: 'medium' as any, target_date: '' });

  const fetchData = async () => {
    try {
      const data = await treatmentService.listPlans(patientId);
      setPlans(data);
      setActivePlan(data.find(p => p.status === 'active') || null);
    } catch (e) {
      showError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  // --- Lógica de Negócio ---

  const handleCreateOrUpdatePlan = async () => {
    if (!planForm.title) return;
    setSubmitting(true);
    try {
      if (isEditingPlan && activePlan) {
        await treatmentService.updatePlan(activePlan.id, { title: planForm.title, description: planForm.description });
        showSuccess("Plano atualizado!");
      } else {
        await treatmentService.createPlan({ patient_id: patientId, title: planForm.title, description: planForm.description, status: 'active' });
        showSuccess("Plano criado!");
      }
      setIsPlanDialogOpen(false);
      fetchData();
    } catch (e) { showError("Erro ao salvar."); } finally { setSubmitting(false); }
  };

  const handleConfirmFinishPlan = async () => {
    if (!activePlan) return;
    const openGoals = activePlan.goals?.filter(g => g.status !== 'completed') || [];
    
    setSubmitting(true);
    try {
      if (openGoals.length > 0) {
        await Promise.all(openGoals.map(g => treatmentService.updateGoal(g.id, { status: 'completed' })));
      }
      await treatmentService.updatePlan(activePlan.id, { status: 'completed', end_date: new Date().toISOString() });
      showSuccess("Plano finalizado com sucesso!");
      setIsFinishDialogOpen(false);
      fetchData();
    } catch (e) { 
      showError("Erro ao finalizar."); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleGoalAction = async () => {
    if (!goalForm.title || !activePlan) return;
    setSubmitting(true);
    try {
      if (editingGoal) {
        await treatmentService.updateGoal(editingGoal.id, { ...goalForm, target_date: goalForm.target_date || null });
      } else {
        await treatmentService.createGoal({ ...goalForm, treatment_plan_id: activePlan.id, patient_id: patientId, target_date: goalForm.target_date || null });
      }
      setIsGoalDialogOpen(false);
      fetchData();
    } catch (e) { showError("Erro ao salvar objetivo."); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  const historyPlans = plans.filter(p => p.status !== 'active');
  const openGoalsCount = activePlan?.goals?.filter(g => g.status !== 'completed').length || 0;

  return (
    <div className="space-y-8 pb-10">
      {!activePlan ? (
        // Estado Vazio (Sem Plano Ativo)
        <div className="text-center py-24 bg-white rounded-[48px] border border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
          <div className="h-24 w-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Target className="h-12 w-12 text-indigo-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Traçar Nova Rota</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-10 font-medium">Não há um plano terapêutico ativo para este paciente no momento.</p>
          <Button onClick={() => { setPlanForm({ title: '', description: '' }); setIsEditingPlan(false); setIsPlanDialogOpen(true); }} className="bg-primary hover:bg-primary/90 rounded-[20px] h-14 px-12 shadow-xl shadow-primary/20 gap-3 font-black text-lg transition-all active:scale-95">
            <Plus className="h-6 w-6" /> Começar Planejamento
          </Button>
        </div>
      ) : (
        // Visualização do Plano Ativo
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-xl shadow-indigo-100/40 rounded-[48px] overflow-hidden bg-white animate-in slide-in-from-left duration-500">
              <div className="h-2 w-full bg-gradient-to-r from-indigo-600 via-primary to-blue-400" />
              <CardHeader className="p-10 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-1.5">
                      <Sparkles className="h-3 w-3 mr-1.5" /> Plano Ativo
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      <Calendar className="h-3.5 w-3.5" /> Iniciado em {format(new Date(activePlan.start_date), "MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setPlanForm({ title: activePlan.title, description: activePlan.description || '' }); setIsEditingPlan(true); setIsPlanDialogOpen(true); }} className="text-slate-400 hover:text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-wider">
                      <Edit2 className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsFinishDialogOpen(true)} className="text-slate-400 hover:text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-4xl font-black text-slate-900 tracking-tight leading-tight">{activePlan.title}</CardTitle>
                <p className="text-slate-500 font-medium leading-relaxed mt-4 text-lg">{activePlan.description}</p>
              </CardHeader>
              <CardContent className="p-10 pt-6 space-y-10">
                <PlanProgress 
                  completed={activePlan.goals?.filter(g => g.status === 'completed').length || 0} 
                  total={activePlan.goals?.length || 0} 
                />
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                      <ClipboardList className="h-6 w-6 text-indigo-500" /> Objetivos do Período
                    </h3>
                    <Button onClick={() => { setEditingGoal(null); setGoalForm({ title: '', description: '', priority: 'medium', target_date: '' }); setIsGoalDialogOpen(true); }} variant="secondary" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl h-10 font-black text-[10px] uppercase tracking-wider gap-2">
                      <Plus className="h-4 w-4" /> Novo Objetivo
                    </Button>
                  </div>
                  <div className="grid gap-5">
                    {activePlan.goals?.map(goal => (
                      <GoalItem key={goal.id} goal={goal} 
                        onUpdateStatus={(id, status) => treatmentService.updateGoal(id, { status }).then(fetchData)}
                        onDelete={(id) => treatmentService.deleteGoal(id).then(() => { showSuccess("Removido"); fetchData(); })}
                        onEdit={(g) => { setEditingGoal(g); setGoalForm({ title: g.title, description: g.description || '', priority: g.priority, target_date: g.target_date || '' }); setIsGoalDialogOpen(true); }}
                      />
                    ))}
                    {(!activePlan.goals || activePlan.goals.length === 0) && (
                      <div className="text-center py-10 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhum objetivo definido ainda.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Histórico Lateral Estilizado */}
          <div className="lg:col-span-4 space-y-8 animate-in slide-in-from-right duration-500">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-4 flex items-center gap-2">
                <History className="h-4 w-4" /> Evolução Histórica
              </h3>
              <div className="grid gap-4">
                {historyPlans.length > 0 ? historyPlans.map(plan => (
                  <Card 
                    key={plan.id} 
                    onClick={() => setViewingHistoryPlan(plan)} 
                    className="border-none shadow-sm rounded-[32px] bg-white hover:shadow-md hover:translate-x-1 transition-all cursor-pointer group overflow-hidden"
                  >
                    <div className={cn(
                      "h-1.5 w-full",
                      plan.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-200'
                    )} />
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={cn(
                          "px-2.5 py-1",
                          plan.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                        )}>
                          {plan.status === 'completed' ? 'Concluído' : 'Arquivado'}
                        </Badge>
                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
                          <Eye className="h-4 w-4" />
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{plan.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(plan.start_date), 'MMM/yy')} — {plan.end_date ? format(new Date(plan.end_date), 'MMM/yy') : 'Fim'}</span>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="py-20 text-center bg-slate-50/30 rounded-[32px] border border-dashed border-slate-100 flex flex-col items-center gap-3">
                     <History className="h-10 w-10 text-slate-100" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sem histórico</p>
                  </div>
                )}
              </div>
            </div>

            <Card className="border-none shadow-sm rounded-[32px] bg-slate-900 text-white overflow-hidden">
               <CardContent className="p-8 space-y-4">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Continuidade Clínica</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                      Finalizar um plano arquiva os objetivos atuais, permitindo que você inicie uma nova fase do tratamento mantendo o histórico de progresso preservado.
                    </p>
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* --- Modais e Diálogos Charmosos --- */}

      {/* Alerta de Finalização de Plano (Substitui o Confirm) */}
      <AlertDialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <AlertDialogContent className="rounded-[40px] border-none shadow-2xl p-10 max-w-lg">
          <AlertDialogHeader>
            <div className="h-16 w-16 bg-amber-50 rounded-[24px] flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-3xl font-black text-slate-900 leading-tight">
              Finalizar Atendimento?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium text-lg leading-relaxed pt-2">
              {openGoalsCount > 0 ? (
                <>
                  Existem <span className="text-amber-600 font-bold">{openGoalsCount} objetivos pendentes</span> neste plano. Ao confirmar, todos serão marcados como concluídos e o plano será movido para o histórico.
                </>
              ) : (
                <>Tem certeza que deseja encerrar este plano terapêutico e movê-lo para o histórico de evolução?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-8 flex flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="rounded-2xl h-14 font-black border-slate-100 flex-1 order-2 sm:order-1">
              Manter Ativo
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleConfirmFinishPlan(); }} 
              className="rounded-2xl h-14 font-black bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex-1 order-1 sm:order-2"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
              Finalizar Plano
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Criar/Editar Plano */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="rounded-[40px] p-10 max-w-lg border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black flex items-center gap-4 text-slate-900">
              <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Target className="h-6 w-6" /> 
              </div>
              {isEditingPlan ? 'Ajustar Plano' : 'Novo Ciclo'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Título do Planejamento</Label>
              <Input placeholder="Ex: Gestão de Ansiedade Social" className="h-14 rounded-2xl font-bold border-slate-100 focus:border-indigo-200" value={planForm.title} onChange={e => setPlanForm({...planForm, title: e.target.value})} />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Descrição / Foco Principal</Label>
              <Textarea placeholder="Qual o objetivo central desta fase do tratamento?" className="rounded-3xl min-h-[120px] border-slate-100 focus:border-indigo-200 resize-none leading-relaxed" value={planForm.description} onChange={e => setPlanForm({...planForm, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateOrUpdatePlan} disabled={submitting || !planForm.title} className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 font-black shadow-lg shadow-indigo-100 text-lg">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
              {isEditingPlan ? 'Salvar Alterações' : 'Confirmar e Iniciar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Criar/Editar Objetivo */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="rounded-[40px] p-10 max-w-lg border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black flex items-center gap-4 text-slate-900">
              <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <ClipboardList className="h-6 w-6" /> 
              </div>
              {editingGoal ? "Ajustar Objetivo" : "Novo Objetivo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">O que pretendemos alcançar?</Label>
              <Input placeholder="Ex: Reduzir frequência de pânico" className="h-14 rounded-2xl font-bold border-slate-100" value={goalForm.title} onChange={e => setGoalForm({...goalForm, title: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Prioridade</Label>
                <Select value={goalForm.priority} onValueChange={v => setGoalForm({...goalForm, priority: v})}>
                  <SelectTrigger className="h-14 rounded-2xl font-bold border-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Prazo Alvo</Label>
                <Input type="date" className="h-14 rounded-2xl font-bold border-slate-100" value={goalForm.target_date} onChange={e => setGoalForm({...goalForm, target_date: e.target.value})} />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Notas / Estratégias</Label>
              <Textarea placeholder="Como o paciente deve trabalhar isso?" className="rounded-2xl min-h-[80px] border-slate-100" value={goalForm.description} onChange={e => setGoalForm({...goalForm, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleGoalAction} disabled={submitting || !goalForm.title} className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 font-black shadow-lg shadow-indigo-100">
               {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
               {editingGoal ? 'Salvar Objetivo' : 'Adicionar ao Plano'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar Histórico */}
      <Dialog open={!!viewingHistoryPlan} onOpenChange={(open) => !open && setViewingHistoryPlan(null)}>
        <DialogContent className="rounded-[48px] p-10 max-w-2xl border-none shadow-2xl overflow-y-auto max-h-[90vh]">
          {viewingHistoryPlan && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-slate-100 text-slate-500 border-none px-4 py-1.5">Plano Encerrado</Badge>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    <Calendar className="h-3.5 w-3.5" /> 
                    {format(new Date(viewingHistoryPlan.start_date), "dd/MM/yy")} — {viewingHistoryPlan.end_date ? format(new Date(viewingHistoryPlan.end_date), "dd/MM/yy") : 'Fim'}
                  </div>
                </div>
                <DialogTitle className="text-4xl font-black text-slate-900 leading-tight">{viewingHistoryPlan.title}</DialogTitle>
                <DialogDescription className="text-lg text-slate-500 font-medium py-4 border-b border-slate-50">
                  {viewingHistoryPlan.description || "Sem descrição disponível."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-8 py-8">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-2">
                    <ClipboardList className="h-4 w-4" /> Objetivos alcançados neste ciclo
                  </h4>
                  <div className="grid gap-4">
                    {viewingHistoryPlan.goals?.map(goal => (
                      <div key={goal.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-[32px] flex items-start justify-between gap-6 group hover:bg-white transition-all">
                         <div className="space-y-1">
                           <p className="text-sm font-bold text-slate-800">{goal.title}</p>
                           <p className="text-[10px] text-slate-500 leading-relaxed pr-4">{goal.description}</p>
                         </div>
                         <div className={cn(
                           "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                           goal.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-300'
                         )}>
                            {goal.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setViewingHistoryPlan(null)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl h-14 font-black transition-all">
                  Fechar Histórico
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
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
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GoalItem } from "./GoalItem";
import { showError, showSuccess } from "@/utils/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Badge local para garantir estabilidade visual
const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors", className)}>
    {children}
  </span>
);

interface TreatmentPlanModuleProps {
  patientId: string;
}

export const TreatmentPlanModule = ({ patientId }: TreatmentPlanModuleProps) => {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<TreatmentPlan | null>(null);
  
  // States para modais
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TreatmentGoal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [planForm, setPlanForm] = useState({ title: '', description: '' });
  const [goalForm, setGoalForm] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium' as any, 
    target_date: '' 
  });

  const fetchData = async () => {
    try {
      const data = await treatmentService.listPlans(patientId);
      setPlans(data);
      const active = data.find(p => p.status === 'active') || null;
      setActivePlan(active);
    } catch (e) {
      showError("Erro ao carregar plano terapêutico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const handleCreatePlan = async () => {
    if (!planForm.title) return;
    setSubmitting(true);
    try {
      await treatmentService.createPlan({
        patient_id: patientId,
        title: planForm.title,
        description: planForm.description,
        status: 'active'
      });
      showSuccess("Plano terapêutico criado!");
      setIsPlanDialogOpen(false);
      setPlanForm({ title: '', description: '' });
      fetchData();
    } catch (e) {
      showError("Erro ao criar plano.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoalAction = async () => {
    if (!goalForm.title || !activePlan) return;
    setSubmitting(true);
    try {
      if (editingGoal) {
        await treatmentService.updateGoal(editingGoal.id, {
          title: goalForm.title,
          description: goalForm.description,
          priority: goalForm.priority,
          target_date: goalForm.target_date || null
        });
        showSuccess("Objetivo atualizado!");
      } else {
        await treatmentService.createGoal({
          treatment_plan_id: activePlan.id,
          patient_id: patientId,
          title: goalForm.title,
          description: goalForm.description,
          priority: goalForm.priority,
          target_date: goalForm.target_date || null
        });
        showSuccess("Objetivo adicionado!");
      }
      setIsGoalDialogOpen(false);
      setEditingGoal(null);
      setGoalForm({ title: '', description: '', priority: 'medium', target_date: '' });
      fetchData();
    } catch (e) {
      showError("Erro ao salvar objetivo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGoalStatus = async (id: string, status: GoalStatus) => {
    try {
      await treatmentService.updateGoal(id, { status });
      fetchData();
    } catch (e) {
      showError("Erro ao atualizar status.");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await treatmentService.deleteGoal(id);
      showSuccess("Objetivo removido.");
      fetchData();
    } catch (e) {
      showError("Erro ao remover objetivo.");
    }
  };

  const handleFinishPlan = async () => {
    if (!activePlan) return;
    try {
      await treatmentService.updatePlan(activePlan.id, { status: 'completed', end_date: new Date().toISOString() });
      showSuccess("Plano concluído com sucesso!");
      fetchData();
    } catch (e) {
      showError("Erro ao finalizar plano.");
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  const completedGoals = activePlan?.goals?.filter(g => g.status === 'completed').length || 0;
  const totalGoals = activePlan?.goals?.length || 0;
  const progressValue = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return (
    <div className="space-y-8 pb-10">
      {!activePlan ? (
        <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
          <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Target className="h-10 w-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Sem Plano Ativo</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
            Defina objetivos e acompanhe a evolução terapêutica do paciente de forma estruturada.
          </p>
          <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 rounded-2xl h-14 px-10 shadow-xl shadow-primary/20 gap-2 font-black transition-all">
                <Plus className="h-5 w-5" /> Criar Plano Terapêutico
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[32px] border-none shadow-2xl p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                  <Target className="text-primary h-6 w-6" /> Novo Plano
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">Título do Plano</Label>
                  <Input 
                    placeholder="Ex: Tratamento para Ansiedade Generalizada" 
                    className="h-12 rounded-2xl border-slate-200 font-bold"
                    value={planForm.title}
                    onChange={(e) => setPlanForm({...planForm, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">Breve Descrição / Foco Principal</Label>
                  <Textarea 
                    placeholder="Quais os principais desafios e o foco do tratamento?" 
                    className="rounded-2xl border-slate-200 resize-none min-h-[100px]"
                    value={planForm.description}
                    onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCreatePlan} 
                  disabled={submitting || !planForm.title}
                  className="w-full bg-primary hover:bg-primary/90 rounded-2xl h-12 font-black shadow-lg shadow-primary/10"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar Plano Terapêutico"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-xl shadow-indigo-100/30 rounded-[40px] overflow-hidden bg-white">
              <div className="h-2 w-full bg-gradient-to-r from-indigo-600 to-primary" />
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">Plano Ativo</Badge>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Iniciado em {format(new Date(activePlan.start_date), "MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleFinishPlan} className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar Plano
                  </Button>
                </div>
                <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">{activePlan.title}</CardTitle>
                <p className="text-slate-500 font-medium leading-relaxed mt-2">{activePlan.description}</p>
              </CardHeader>
              <CardContent className="p-8 pt-6 space-y-8">
                <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-indigo-500" />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">Evolução dos Objetivos</span>
                    </div>
                    <span className="text-sm font-black text-indigo-600">{Math.round(progressValue)}%</span>
                  </div>
                  <Progress value={progressValue} className="h-2.5 bg-slate-200" />
                  <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
                    {completedGoals} de {totalGoals} objetivos concluídos
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-indigo-400" /> Objetivos Terapêuticos
                    </h3>
                    <Button 
                      onClick={() => { setEditingGoal(null); setGoalForm({ title: '', description: '', priority: 'medium', target_date: '' }); setIsGoalDialogOpen(true); }}
                      variant="ghost" 
                      className="text-primary hover:bg-primary/10 rounded-xl h-10 font-bold text-xs"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Adicionar
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {activePlan.goals && activePlan.goals.length > 0 ? (
                      activePlan.goals
                        .sort((a, b) => {
                          const priorityMap = { high: 0, medium: 1, low: 2 };
                          return priorityMap[a.priority] - priorityMap[b.priority];
                        })
                        .map((goal) => (
                          <GoalItem 
                            key={goal.id} 
                            goal={goal} 
                            onUpdateStatus={handleUpdateGoalStatus}
                            onDelete={handleDeleteGoal}
                            onEdit={(g) => {
                              setEditingGoal(g);
                              setGoalForm({
                                title: g.title,
                                description: g.description || '',
                                priority: g.priority,
                                target_date: g.target_date || ''
                              });
                              setIsGoalDialogOpen(true);
                            }}
                          />
                        ))
                    ) : (
                      <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Nenhum objetivo definido ainda.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-sm rounded-[32px] bg-white">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <History className="h-4 w-4" /> Histórico de Planos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {plans.filter(p => p.status !== 'active').length > 0 ? (
                  plans.filter(p => p.status !== 'active').map(plan => (
                    <div key={plan.id} className="p-4 rounded-2xl border border-slate-50 bg-slate-50/30 space-y-2 hover:border-indigo-100 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-white text-slate-400 border-none text-[8px] uppercase">{plan.status === 'completed' ? 'Concluído' : 'Arquivado'}</Badge>
                        <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">{plan.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {format(new Date(plan.start_date), 'MMM/yy')} — {plan.end_date ? format(new Date(plan.end_date), 'MMM/yy') : 'Em aberto'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center opacity-40">
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum plano anterior.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[32px] bg-indigo-600 text-white overflow-hidden">
               <CardContent className="p-6 space-y-4">
                  <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Visualização Clínica</h4>
                    <p className="text-xs text-indigo-100 leading-relaxed mt-1">O plano terapêutico ajuda a manter o foco clínico entre as sessões e melhora a percepção de evolução do paciente.</p>
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <ClipboardList className="text-primary h-6 w-6" /> {editingGoal ? "Editar Objetivo" : "Novo Objetivo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400">O que queremos alcançar?</Label>
              <Input 
                placeholder="Ex: Identificar gatilhos de ansiedade no trabalho" 
                className="h-12 rounded-2xl border-slate-200 font-bold"
                value={goalForm.title}
                onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Prioridade</Label>
                <Select value={goalForm.priority} onValueChange={(v) => setGoalForm({...goalForm, priority: v})}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Prazo (opcional)</Label>
                <Input 
                  type="date"
                  className="h-12 rounded-2xl border-slate-200 font-bold"
                  value={goalForm.target_date}
                  onChange={(e) => setGoalForm({...goalForm, target_date: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400">Descrição / Notas Adicionais</Label>
              <Textarea 
                placeholder="Detalhes sobre como trabalhar este objetivo..." 
                className="rounded-2xl border-slate-200 resize-none min-h-[100px]"
                value={goalForm.description}
                onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleGoalAction} 
              disabled={submitting || !goalForm.title}
              className="w-full bg-primary hover:bg-primary/90 rounded-2xl h-12 font-black shadow-lg shadow-primary/10"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingGoal ? "Salvar Alterações" : "Adicionar ao Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
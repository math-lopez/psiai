"use client";

import React, { useState, useEffect } from "react";
import { treatmentService } from "@/services/treatmentService";
import { TreatmentPlan, TreatmentGoal, GoalStatus, GoalPriority } from "@/types/treatment";
import { 
  Target, Plus, ClipboardList, CheckCircle2, Clock, AlertCircle, MoreHorizontal, 
  Trash2, Edit2, Calendar, Flag, Loader2, Sparkles, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

export const TreatmentPlanTab = ({ patientId }: { patientId: string }) => {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<TreatmentPlan | null>(null);
  
  // Modais
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null);
  const [editingGoal, setEditingGoal] = useState<TreatmentGoal | null>(null);

  const fetchPlans = async () => {
    try {
      const data = await treatmentService.listPlans(patientId);
      setPlans(data);
      const active = data.find(p => p.status === 'active') || data[0] || null;
      setActivePlan(active);
    } catch (e) { showError("Erro ao carregar planos."); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, [patientId]);

  const calculateProgress = (goals: TreatmentGoal[] = []) => {
    if (goals.length === 0) return 0;
    const completed = goals.filter(g => g.status === 'completed').length;
    return Math.round((completed / goals.length) * 100);
  };

  const handleSavePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const planData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as any || 'active',
      patient_id: patientId,
    };

    try {
      if (editingPlan) {
        await treatmentService.updatePlan(editingPlan.id, planData);
        showSuccess("Plano atualizado!");
      } else {
        await treatmentService.createPlan(planData);
        showSuccess("Plano criado!");
      }
      setIsPlanModalOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (e) { showError("Erro ao salvar plano."); }
  };

  const handleSaveGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activePlan) return;
    const formData = new FormData(e.currentTarget);
    const goalData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as GoalPriority,
      status: formData.get('status') as GoalStatus,
      target_date: formData.get('target_date') as string || null,
      treatment_plan_id: activePlan.id,
      patient_id: patientId,
    };

    try {
      if (editingGoal) {
        await treatmentService.updateGoal(editingGoal.id, goalData);
        showSuccess("Objetivo atualizado!");
      } else {
        await treatmentService.createGoal(goalData);
        showSuccess("Objetivo adicionado!");
      }
      setIsGoalModalOpen(false);
      setEditingGoal(null);
      fetchPlans();
    } catch (e) { showError("Erro ao salvar objetivo."); }
  };

  const updateGoalStatus = async (goalId: string, status: GoalStatus) => {
    try {
      await treatmentService.updateGoal(goalId, { status });
      showSuccess("Status atualizado!");
      fetchPlans();
    } catch (e) { showError("Erro ao atualizar status."); }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm("Excluir este objetivo?")) return;
    try {
      await treatmentService.deleteGoal(id);
      showSuccess("Excluído!");
      fetchPlans();
    } catch (e) { showError("Erro ao excluir."); }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  const priorityColors = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-blue-100 text-blue-600",
    high: "bg-amber-100 text-amber-600",
    urgent: "bg-red-100 text-red-600"
  };

  const statusIcons = {
    not_started: { icon: Clock, label: "Não iniciado", class: "bg-slate-100 text-slate-500" },
    in_progress: { icon: Loader2, label: "Em andamento", class: "bg-indigo-100 text-indigo-600" },
    completed: { icon: CheckCircle2, label: "Concluído", class: "bg-emerald-100 text-emerald-600" },
    paused: { icon: AlertCircle, label: "Pausado", class: "bg-amber-100 text-amber-600" },
    cancelled: { icon: Trash2, label: "Cancelado", class: "bg-red-100 text-red-600" }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {!activePlan ? (
        <Card className="border-none shadow-sm rounded-[40px] p-12 text-center bg-white">
          <Target className="h-16 w-16 text-slate-100 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-slate-900 mb-2">Sem Plano Terapêutico</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Defina objetivos e acompanhe a evolução do seu paciente de forma estruturada.
          </p>
          <Button onClick={() => setIsPlanModalOpen(true)} className="bg-indigo-600 h-12 px-8 rounded-2xl font-black shadow-lg shadow-indigo-100">
            <Plus className="mr-2 h-5 w-5" /> Criar Novo Plano
          </Button>
        </Card>
      ) : (
        <>
          {/* Dashboard do Plano */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
              <div className="h-2 bg-indigo-600 w-full" />
              <CardHeader className="p-8 pb-4 flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl font-black text-slate-900">{activePlan.title}</CardTitle>
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none uppercase text-[10px] font-black tracking-widest px-2.5">
                      Ativo
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-500 font-medium">{activePlan.description || "Sem descrição detalhada."}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal className="h-5 w-5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => { setEditingPlan(activePlan); setIsPlanModalOpen(true); }} className="gap-2"><Edit2 className="h-4 w-4" /> Editar Plano</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 gap-2" onClick={() => treatmentService.deletePlan(activePlan.id).then(fetchPlans)}><Trash2 className="h-4 w-4" /> Excluir Plano</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                    <span>Progresso Terapêutico</span>
                    <span className="text-indigo-600">{calculateProgress(activePlan.goals)}%</span>
                  </div>
                  <Progress value={calculateProgress(activePlan.goals)} className="h-3 rounded-full bg-slate-100" />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">Iniciado em {format(new Date(activePlan.start_date || activePlan.created_at), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{activePlan.goals?.length || 0} Objetivos definidos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[32px] bg-indigo-600 text-white p-8 flex flex-col justify-between overflow-hidden relative group">
              <Sparkles className="absolute -right-10 -bottom-10 h-40 w-40 text-white/10 group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <h3 className="text-lg font-black mb-2 flex items-center gap-2 uppercase tracking-widest text-[12px] opacity-80">Próximo Passo Clínico</h3>
                <p className="text-sm font-medium leading-relaxed mb-6">Mantenha os objetivos atualizados para visualizar o progresso real do tratamento em cada sessão.</p>
              </div>
              <Button onClick={() => setIsGoalModalOpen(true)} className="relative z-10 w-full h-12 bg-white text-indigo-600 hover:bg-slate-50 font-black rounded-2xl gap-2 shadow-xl">
                <Plus className="h-5 w-5" /> Adicionar Objetivo
              </Button>
            </Card>
          </div>

          {/* Lista de Objetivos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                 <ClipboardList className="h-4 w-4" /> Objetivos Terapêuticos
               </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {activePlan.goals && activePlan.goals.length > 0 ? (
                activePlan.goals.map((goal) => {
                  const statusInfo = statusIcons[goal.status];
                  return (
                    <Card key={goal.id} className="border-none shadow-sm rounded-3xl bg-white hover:shadow-md transition-all group overflow-hidden">
                      <div className={cn("h-1 w-full", goal.status === 'completed' ? 'bg-emerald-500' : 'bg-transparent')} />
                      <CardContent className="p-6 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", statusInfo.class)}>
                             <statusInfo.icon className={cn("h-6 w-6", goal.status === 'in_progress' && "animate-spin")} />
                          </div>
                          <div className="min-w-0">
                            <h4 className={cn("font-bold text-slate-900 truncate", goal.status === 'completed' && "line-through opacity-50")}>{goal.title}</h4>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                               <Badge className={cn("border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5", priorityColors[goal.priority])}>
                                 <Flag className="h-2 w-2 mr-1" /> {goal.priority}
                               </Badge>
                               {goal.target_date && (
                                 <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                                   <Calendar className="h-3 w-3" /> Prazo: {format(new Date(goal.target_date), "dd/MM/yy")}
                                 </span>
                               )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                           <Select value={goal.status} onValueChange={(v: GoalStatus) => updateGoalStatus(goal.id, v)}>
                             <SelectTrigger className="h-9 w-[140px] rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-100 bg-slate-50">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="rounded-xl">
                               <SelectItem value="not_started">Não iniciado</SelectItem>
                               <SelectItem value="in_progress">Em andamento</SelectItem>
                               <SelectItem value="completed">Concluído</SelectItem>
                               <SelectItem value="paused">Pausado</SelectItem>
                               <SelectItem value="cancelled">Cancelado</SelectItem>
                             </SelectContent>
                           </Select>

                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal className="h-4 w-4 text-slate-400" /></Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="rounded-xl">
                               <DropdownMenuItem onClick={() => { setEditingGoal(goal); setIsGoalModalOpen(true); }} className="gap-2"><Edit2 className="h-3 w-3" /> Editar</DropdownMenuItem>
                               <DropdownMenuItem className="text-red-600 gap-2" onClick={() => deleteGoal(goal.id)}><Trash2 className="h-3 w-3" /> Excluir</DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                   <Target className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                   <p className="text-sm text-slate-400 font-medium">Nenhum objetivo definido para este plano.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal Plano */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editingPlan ? "Editar Plano" : "Novo Plano Terapêutico"}</DialogTitle>
            <DialogDescription>Dê um nome e descreva o foco do tratamento.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePlan} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-black uppercase text-slate-400">Título do Plano</Label>
              <Input id="title" name="title" defaultValue={editingPlan?.title} required className="rounded-xl h-12" placeholder="Ex: Tratamento Ansiedade Social" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-black uppercase text-slate-400">Foco/Objetivo Geral</Label>
              <Textarea id="description" name="description" defaultValue={editingPlan?.description || ''} className="rounded-xl min-h-[100px]" placeholder="Breve descrição clínica do plano..." />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full bg-indigo-600 rounded-2xl h-12 font-black shadow-lg shadow-indigo-100">Salvar Plano</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Objetivo */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editingGoal ? "Editar Objetivo" : "Novo Objetivo"}</DialogTitle>
            <DialogDescription>Defina uma meta específica e mensurável.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveGoal} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="g-title" className="text-xs font-black uppercase text-slate-400">Título</Label>
              <Input id="g-title" name="title" defaultValue={editingGoal?.title} required className="rounded-xl h-12" placeholder="Ex: Higiene do sono" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-xs font-black uppercase text-slate-400">Prioridade</Label>
                <Select name="priority" defaultValue={editingGoal?.priority || 'medium'}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_date" className="text-xs font-black uppercase text-slate-400">Prazo Alvo</Label>
                <Input id="target_date" name="target_date" type="date" defaultValue={editingGoal?.target_date || ''} className="rounded-xl h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-status" className="text-xs font-black uppercase text-slate-400">Status</Label>
              <Select name="status" defaultValue={editingGoal?.status || 'not_started'}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="not_started">Não iniciado</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full bg-indigo-600 rounded-2xl h-12 font-black shadow-lg shadow-indigo-100">Salvar Objetivo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
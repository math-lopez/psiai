"use client";

import React, { useState, useEffect } from "react";
import { TreatmentPlan, TreatmentGoal, GoalStatus } from "@/types/treatment";
import { treatmentService } from "@/services/treatmentService";
import { 
  Target, Plus, Loader2, ClipboardList, ChevronRight, 
  History, CheckCircle2, TrendingUp, LayoutDashboard, 
  Calendar, Edit2, Eye
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Sub-componentes Locais para Modularidade ---

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>
    {children}
  </span>
);

const PlanProgress = ({ completed, total }: { completed: number, total: number }) => {
  const progressValue = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-500" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Evolução</span>
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

  const handleFinishPlan = async () => {
    if (!activePlan) return;
    const openGoals = activePlan.goals?.filter(g => g.status !== 'completed') || [];
    
    let confirmMsg = "Deseja marcar este plano como concluído?";
    if (openGoals.length > 0) {
      confirmMsg = `Existem ${openGoals.length} objetivos em aberto. Deseja marcar TODOS como concluídos e finalizar o plano?`;
    }

    if (!confirm(confirmMsg)) return;

    try {
      if (openGoals.length > 0) {
        await Promise.all(openGoals.map(g => treatmentService.updateGoal(g.id, { status: 'completed' })));
      }
      await treatmentService.updatePlan(activePlan.id, { status: 'completed', end_date: new Date().toISOString() });
      showSuccess("Plano finalizado com sucesso!");
      fetchData();
    } catch (e) { showError("Erro ao finalizar."); }
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

  return (
    <div className="space-y-8 pb-10">
      {!activePlan ? (
        // Estado Vazio (Sem Plano Ativo)
        <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
          <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Target className="h-10 w-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Sem Plano Ativo</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">Defina objetivos para acompanhar a evolução do paciente.</p>
          <Button onClick={() => { setPlanForm({ title: '', description: '' }); setIsEditingPlan(false); setIsPlanDialogOpen(true); }} className="bg-primary rounded-2xl h-14 px-10 shadow-xl shadow-primary/20 gap-2 font-black">
            <Plus className="h-5 w-5" /> Criar Plano Terapêutico
          </Button>
        </div>
      ) : (
        // Visualização do Plano Ativo
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Card className="border-none shadow-xl shadow-indigo-100/30 rounded-[40px] overflow-hidden bg-white">
              <div className="h-2 w-full bg-gradient-to-r from-indigo-600 to-primary" />
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">Plano Ativo</Badge>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {format(new Date(activePlan.start_date), "MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setPlanForm({ title: activePlan.title, description: activePlan.description || '' }); setIsEditingPlan(true); setIsPlanDialogOpen(true); }} className="text-slate-400 hover:text-indigo-600 rounded-xl font-bold text-xs">
                      <Edit2 className="h-3.5 w-3.5 mr-2" /> Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleFinishPlan} className="text-slate-400 hover:text-emerald-600 rounded-xl font-bold text-xs">
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">{activePlan.title}</CardTitle>
                <p className="text-slate-500 font-medium leading-relaxed mt-2">{activePlan.description}</p>
              </CardHeader>
              <CardContent className="p-8 pt-6 space-y-8">
                <PlanProgress 
                  completed={activePlan.goals?.filter(g => g.status === 'completed').length || 0} 
                  total={activePlan.goals?.length || 0} 
                />
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-indigo-400" /> Objetivos
                    </h3>
                    <Button onClick={() => { setEditingGoal(null); setGoalForm({ title: '', description: '', priority: 'medium', target_date: '' }); setIsGoalDialogOpen(true); }} variant="ghost" className="text-primary rounded-xl h-10 font-bold text-xs">
                      <Plus className="h-4 w-4 mr-2" /> Adicionar
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {activePlan.goals?.map(goal => (
                      <GoalItem key={goal.id} goal={goal} 
                        onUpdateStatus={(id, status) => treatmentService.updateGoal(id, { status }).then(fetchData)}
                        onDelete={(id) => treatmentService.deleteGoal(id).then(() => { showSuccess("Removido"); fetchData(); })}
                        onEdit={(g) => { setEditingGoal(g); setGoalForm({ title: g.title, description: g.description || '', priority: g.priority, target_date: g.target_date || '' }); setIsGoalDialogOpen(true); }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Histórico Lateral */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-sm rounded-[32px] bg-white">
              <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><History className="h-4 w-4" /> Histórico</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {historyPlans.length > 0 ? historyPlans.map(plan => (
                  <div key={plan.id} onClick={() => setViewingHistoryPlan(plan)} className="p-4 rounded-2xl border border-slate-50 bg-slate-50/30 space-y-2 hover:border-indigo-100 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-white text-slate-400 border-none text-[8px] uppercase">{plan.status === 'completed' ? 'Concluído' : 'Arquivado'}</Badge>
                      <Eye className="h-4 w-4 text-slate-200 group-hover:text-indigo-300 transition-all" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 line-clamp-1">{plan.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {format(new Date(plan.start_date), 'MMM/yy')} — {plan.end_date ? format(new Date(plan.end_date), 'MMM/yy') : 'Encerrado'}
                    </p>
                  </div>
                )) : <div className="py-10 text-center opacity-40 text-xs font-bold uppercase">Sem histórico.</div>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* --- Modais de Suporte --- */}

      {/* Modal Criar/Editar Plano */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="rounded-[32px] p-8">
          <DialogHeader><DialogTitle className="text-2xl font-black flex items-center gap-3"><Target className="text-primary h-6 w-6" /> {isEditingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle></DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400">Título</Label>
              <Input placeholder="Título do tratamento..." className="h-12 rounded-2xl font-bold" value={planForm.title} onChange={e => setPlanForm({...planForm, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400">Descrição</Label>
              <Textarea placeholder="Foco do tratamento..." className="rounded-2xl min-h-[100px]" value={planForm.description} onChange={e => setPlanForm({...planForm, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateOrUpdatePlan} disabled={submitting || !planForm.title} className="w-full bg-primary rounded-2xl h-12 font-black">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Plano"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Criar/Editar Objetivo */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="rounded-[32px] p-8">
          <DialogHeader><DialogTitle className="text-2xl font-black flex items-center gap-3"><ClipboardList className="text-primary h-6 w-6" /> {editingGoal ? "Editar Objetivo" : "Novo Objetivo"}</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400">Objetivo</Label>
              <Input placeholder="O que queremos alcançar?" className="h-12 rounded-2xl font-bold" value={goalForm.title} onChange={e => setGoalForm({...goalForm, title: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Prioridade</Label>
                <Select value={goalForm.priority} onValueChange={v => setGoalForm({...goalForm, priority: v})}>
                  <SelectTrigger className="h-12 rounded-2xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Prazo</Label>
                <Input type="date" className="h-12 rounded-2xl font-bold" value={goalForm.target_date} onChange={e => setGoalForm({...goalForm, target_date: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400">Notas</Label>
              <Textarea placeholder="Detalhes..." className="rounded-2xl" value={goalForm.description} onChange={e => setGoalForm({...goalForm, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter><Button onClick={handleGoalAction} disabled={submitting || !goalForm.title} className="w-full bg-primary rounded-2xl h-12 font-black">Salvar Objetivo</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Visualizar Histórico */}
      <Dialog open={!!viewingHistoryPlan} onOpenChange={(open) => !open && setViewingHistoryPlan(null)}>
        <DialogContent className="rounded-[40px] p-8 max-w-2xl border-none shadow-2xl overflow-y-auto max-h-[90vh]">
          {viewingHistoryPlan && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-slate-100 text-slate-500 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">Plano Encerrado</Badge>
                </div>
                <DialogTitle className="text-3xl font-black text-slate-900">{viewingHistoryPlan.title}</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium py-2">
                  Período: {format(new Date(viewingHistoryPlan.start_date), "dd/MM/yyyy")} até {viewingHistoryPlan.end_date ? format(new Date(viewingHistoryPlan.end_date), "dd/MM/yyyy") : 'N/A'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 italic text-slate-600">
                  "{viewingHistoryPlan.description || "Sem descrição disponível."}"
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" /> Objetivos deste período
                  </h4>
                  <div className="grid gap-3">
                    {viewingHistoryPlan.goals?.map(goal => (
                      <div key={goal.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between opacity-80">
                         <div>
                           <p className="text-sm font-bold text-slate-800">{goal.title}</p>
                           <p className="text-[10px] text-slate-400">{goal.description}</p>
                         </div>
                         {goal.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setViewingHistoryPlan(null)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl h-12 font-black">Fechar Visualização</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
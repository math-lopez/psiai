"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Loader2, 
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Repeat,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeeklyCalendar } from "@/components/agenda/WeeklyCalendar";
import { sessionService } from "@/services/sessionService";
import { patientService } from "@/services/patientService";
import { Session, Patient } from "@/types";
import { format, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const Agenda = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: "",
    date: "",
    hour: "09:00",
    duration: 50,
    status: "scheduled" as any,
    isRecurrent: false,
    recurrenceUntil: ""
  });

  const fetchData = async () => {
    try {
      const [s, p] = await Promise.all([
        sessionService.list(),
        patientService.list()
      ]);
      setSessions(s);
      setPatients(p);
    } catch (e) {
      showError("Erro ao carregar agenda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleOpenNew = (date: Date, hour?: number) => {
    setSelectedSession(null);
    setFormData({
      patient_id: "",
      date: format(date, "yyyy-MM-dd"),
      hour: hour ? `${hour.toString().padStart(2, '0')}:00` : "09:00",
      duration: 50,
      status: "scheduled",
      isRecurrent: false,
      recurrenceUntil: format(addWeeks(date, 12), "yyyy-MM-dd")
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (session: Session) => {
    const sDate = new Date(session.session_date);
    setSelectedSession(session);
    setFormData({
      patient_id: session.patient_id,
      date: format(sDate, "yyyy-MM-dd"),
      hour: format(sDate, "HH:mm"),
      duration: session.duration_minutes,
      status: session.status,
      isRecurrent: false,
      recurrenceUntil: ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.patient_id || !formData.date) return;
    setSubmitting(true);
    try {
      const sessionDate = new Date(`${formData.date}T${formData.hour}`);
      const payload = {
        patient_id: formData.patient_id,
        session_date: sessionDate.toISOString(),
        duration_minutes: formData.duration,
        status: formData.status,
        record_type: 'manual' as const 
      };

      if (selectedSession) {
        await sessionService.update(selectedSession.id, payload);
        showSuccess("Agendamento atualizado!");
      } else {
        if (formData.isRecurrent && formData.recurrenceUntil) {
          await sessionService.createRecurrent(payload, formData.recurrenceUntil);
          showSuccess("Sessões recorrentes agendadas!");
        } else {
          await sessionService.create(payload);
          showSuccess("Sessão agendada com sucesso!");
        }
      }

      setIsModalOpen(false);
      fetchData();
    } catch (e: any) {
      showError(e.message || "Erro ao salvar agendamento.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Agenda Clínica</h1>
          {/* Indicador de Mês e Ano */}
          <p className="text-indigo-600 mt-1 font-black uppercase tracking-widest text-sm flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-10 w-10 rounded-xl"><ChevronLeft className="h-5 w-5" /></Button>
            <Button variant="ghost" onClick={handleToday} className="px-4 font-black text-xs uppercase tracking-widest text-slate-600">Hoje</Button>
            <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-10 w-10 rounded-xl"><ChevronRight className="h-5 w-5" /></Button>
          </div>
          <Button 
            onClick={() => handleOpenNew(new Date())}
            className="bg-primary hover:bg-primary/90 rounded-2xl h-12 px-6 shadow-xl shadow-primary/20 gap-2 font-black"
          >
            <Plus className="h-5 w-5" /> Novo Agendamento
          </Button>
        </div>
      </div>

      <WeeklyCalendar 
        currentDate={currentDate} 
        sessions={sessions} 
        onSessionClick={handleOpenEdit}
        onEmptySlotClick={handleOpenNew}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <CalendarIcon className="text-primary h-6 w-6" /> 
              {selectedSession ? "Detalhes da Sessão" : "Agendar Consulta"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Paciente</Label>
              <Select 
                disabled={!!selectedSession}
                value={formData.patient_id} 
                onValueChange={(v) => setFormData({...formData, patient_id: v})}
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-bold">
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Data</Label>
                <Input type="date" className="h-12 rounded-2xl border-slate-200 font-bold" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Horário</Label>
                <Input type="time" className="h-12 rounded-2xl border-slate-200 font-bold" value={formData.hour} onChange={(e) => setFormData({...formData, hour: e.target.value})} />
              </div>
            </div>

            {!selectedSession && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-indigo-500" />
                    <Label className="text-xs font-bold text-slate-700">Repetir semanalmente</Label>
                  </div>
                  <Switch checked={formData.isRecurrent} onCheckedChange={(v) => setFormData({...formData, isRecurrent: v})} />
                </div>
                {formData.isRecurrent && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Até quando repetir?</Label>
                    <Input type="date" className="h-10 rounded-xl bg-white" value={formData.recurrenceUntil} onChange={(e) => setFormData({...formData, recurrenceUntil: e.target.value})} />
                  </div>
                )}
              </div>
            )}

            {selectedSession && (
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-14 font-black shadow-lg shadow-indigo-100 gap-2 text-lg"
                  onClick={() => navigate(`/sessoes/editar/${selectedSession.id}`)}
                >
                  <FileText className="h-5 w-5" /> Iniciar Atendimento
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant={formData.status === 'cancelled' ? 'secondary' : 'outline'}
                    className={cn("rounded-2xl h-12 gap-2 font-bold", formData.status === 'cancelled' && "bg-red-50 text-red-600 border-red-100")}
                    onClick={() => setFormData({...formData, status: 'cancelled'})}
                  >
                    <XCircle className="h-4 w-4" /> Cancelar
                  </Button>
                  <Button 
                    variant="outline"
                    className="rounded-2xl h-12 font-bold text-red-500 border-red-100 hover:bg-red-50"
                    onClick={async () => {
                       if (confirm("Excluir este agendamento permanentemente?")) {
                          await sessionService.delete(selectedSession.id);
                          setIsModalOpen(false);
                          fetchData();
                       }
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-2xl h-12 font-bold" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl h-12 font-black shadow-lg shadow-primary/10" onClick={handleSave} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (selectedSession ? "Salvar Alterações" : "Confirmar Agendamento")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;
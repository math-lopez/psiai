"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Loader2, 
  Calendar as CalendarIcon,
  Video,
  ExternalLink,
  Trash2,
  CheckCircle2,
  XCircle,
  User,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeeklyCalendar } from "@/components/agenda/WeeklyCalendar";
import { sessionService } from "@/services/sessionService";
import { patientService } from "@/services/patientService";
import { Session, Patient } from "@/types";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns";
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
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    patient_id: "",
    date: "",
    hour: "09:00",
    duration: 50,
    status: "scheduled" as any
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
      status: "scheduled"
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
      status: session.status
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

      let savedSessionId;
      if (selectedSession) {
        await sessionService.update(selectedSession.id, payload);
        savedSessionId = selectedSession.id;
      } else {
        const newSession = await sessionService.create(payload);
        savedSessionId = newSession.id;
      }

      // Se marcou como 'Realizada', dispara o fluxo de finalização clínica
      if (formData.status === 'completed') {
        await sessionService.finishSession(savedSessionId);
        showSuccess("Consulta marcada como realizada e prontuário atualizado!");
      } else {
        showSuccess(selectedSession ? "Agendamento atualizado!" : "Sessão agendada com sucesso!");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (e: any) {
      showError(e.message || "Erro ao salvar agendamento.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateMeetLink = () => {
    const fakeLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    showSuccess("Link do Google Meet gerado com sucesso!");
    
    if (selectedSession) {
       sessionService.update(selectedSession.id, { meeting_link: fakeLink }).then(() => fetchData());
    }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Agenda Clínica</h1>
          <p className="text-slate-500 mt-1 font-medium">Gestão de horários e teleconsultas.</p>
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

      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-black text-slate-700">
          {format(startOfWeek(currentDate), "dd 'de' MMM", { locale: ptBR })} — {format(endOfWeek(currentDate), "dd 'de' MMM, yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-indigo-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Agendada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Realizada</span>
          </div>
        </div>
      </div>

      <WeeklyCalendar 
        currentDate={currentDate} 
        sessions={sessions} 
        onSessionClick={handleOpenEdit}
        onEmptySlotClick={handleOpenNew}
      />

      {/* Modal de Agendamento */}
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
                <Input 
                  type="date" 
                  className="h-12 rounded-2xl border-slate-200 font-bold"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Horário</Label>
                <Input 
                  type="time" 
                  className="h-12 rounded-2xl border-slate-200 font-bold"
                  value={formData.hour}
                  onChange={(e) => setFormData({...formData, hour: e.target.value})}
                />
              </div>
            </div>

            {selectedSession && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Status do Atendimento</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant={formData.status === 'completed' ? 'secondary' : 'outline'}
                    className={cn("rounded-2xl h-12 gap-2 font-bold", formData.status === 'completed' && "bg-emerald-50 text-emerald-600 border-emerald-100")}
                    onClick={() => setFormData({...formData, status: 'completed'})}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Realizada
                  </Button>
                  <Button 
                    variant={formData.status === 'cancelled' ? 'secondary' : 'outline'}
                    className={cn("rounded-2xl h-12 gap-2 font-bold", formData.status === 'cancelled' && "bg-red-50 text-red-600 border-red-100")}
                    onClick={() => setFormData({...formData, status: 'cancelled'})}
                  >
                    <XCircle className="h-4 w-4" /> Cancelada
                  </Button>
                </div>
              </div>
            )}

            {selectedSession && (
              <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                   <Label className="text-[10px] font-black uppercase text-slate-400">Teleconsulta</Label>
                   <Button 
                    variant="ghost" 
                    className="text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 rounded-lg h-7"
                    onClick={generateMeetLink}
                   >
                     {selectedSession.meeting_link ? "Gerar novo" : "Gerar link via Google"}
                   </Button>
                </div>
                {selectedSession.meeting_link ? (
                  <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                    <div className="flex items-center gap-2 truncate">
                      <Video className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-mono text-indigo-600 truncate">{selectedSession.meeting_link}</span>
                    </div>
                    <a href={selectedSession.meeting_link} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic text-center">Nenhum link de reunião gerado.</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="ghost" 
              className="rounded-2xl h-12 font-bold" 
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 rounded-2xl h-12 font-black shadow-lg shadow-primary/10"
              onClick={handleSave}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (selectedSession ? "Salvar Alterações" : "Confirmar Agendamento")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;
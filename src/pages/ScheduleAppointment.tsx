"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import PatientSelector from '../components/PatientSelector';

interface Appointment {
  patientId: string;
  date: Date;
}

const patients = [
  { id: '1', name: 'João Silva' },
  { id: '2', name: 'Maria Souza' },
];

const ScheduleAppointment: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient({ patientId: patient.id, date: new Date() });
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Agendar Consulta</h1>
      
      <div className="max-w-md">
        <PatientSelector patients={patients} onSelect={handleSelectPatient} />
      </div>

      {selectedPatient && (
        <div className="mt-6 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-4">
          <div>
            <p className="text-xs font-black uppercase text-indigo-400 tracking-widest">Paciente Selecionado</p>
            <p className="text-lg font-bold text-indigo-900">{patients.find(p => p.id === selectedPatient.patientId)?.name}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-indigo-400 tracking-widest">Data Sugerida</p>
            <p className="text-lg font-bold text-indigo-900">{selectedPatient.date.toLocaleDateString('pt-BR')}</p>
          </div>
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-12 font-black"
            onClick={() => console.log('Consulta agendada!')}
          >
            Confirmar Agendamento
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScheduleAppointment;
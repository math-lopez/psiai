"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";

interface Appointment {
  id: string;
  patientName: string;
  date: Date;
}

interface AppointmentListProps {
  appointments: Appointment[];
}

const AppointmentList: React.FC<AppointmentListProps> = ({ appointments }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAppointments = appointments.filter(appointment =>
    appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Input
        type="text"
        placeholder="Buscar por um agendamento..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <ul>
        {filteredAppointments.map(appointment => (
          <li key={appointment.id} className="p-2 border-b border-slate-100">
            <p className="font-bold text-slate-900">Paciente: {appointment.patientName}</p>
            <p className="text-sm text-slate-500">Data: {appointment.date.toLocaleDateString('pt-BR')}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AppointmentList;
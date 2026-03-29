"use client";

import React, { useState } from 'react';
import { Input } from '@shadcn/ui';

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
        placeholder="Search for an appointment..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <ul>
        {filteredAppointments.map(appointment => (
          <li key={appointment.id}>
            <p>Patient: {appointment.patientName}</p>
            <p>Date: {appointment.date.toDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AppointmentList;
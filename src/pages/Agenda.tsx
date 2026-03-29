"use client";

import React from 'react';
import AppointmentList from '../components/AppointmentList';

interface Appointment {
  id: string;
  patientName: string;
  date: Date;
}

const appointments = [
  { id: '1', patientName: 'John Doe', date: new Date('2023-10-01') },
  { id: '2', patientName: 'Jane Smith', date: new Date('2023-10-05') },
  // Add more appointments as needed
];

const Agenda: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Agenda</h1>
      <AppointmentList appointments={appointments} />
    </div>
  );
};

export default Agenda;
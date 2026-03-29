"use client";

import React, { useState } from 'react';
import { Button } from '@shadcn/ui/button';
import PatientSelector from '../components/PatientSelector';

interface Appointment {
  patientId: string;
  date: Date;
}

const patients = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  // Add more patients as needed
];

const ScheduleAppointment: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient({ patientId: patient.id, date: new Date() });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Schedule Appointment</h1>
      <PatientSelector patients={patients} onSelect={handleSelectPatient} />
      {selectedPatient && (
        <div className="mt-4">
          <p>Patient: {selectedPatient.patientId}</p>
          <p>Date: {selectedPatient.date.toDateString()}</p>
          <Button onClick={() => console.log('Appointment scheduled!')}>
            Schedule
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScheduleAppointment;
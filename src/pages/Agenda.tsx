"use client";

import React, { useState } from 'react';
import { Button } from '@shadcn/ui/button';
import PatientSelector from '../components/PatientSelector';

interface Appointment {
  date: Date;
  patientId: string;
}

const patients = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  // Add more patients as needed
];

const Agenda: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSelectPatient = (patient: any) => {
    if (selectedDate) {
      setSelectedPatient({ date: selectedDate, patientId: patient.id });
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Agenda</h1>
      <div className="mb-4">
        <Button onClick={() => setSelectedDate(new Date())}>Select Today</Button>
        {/* Add more date selection options as needed */}
      </div>
      {selectedDate && (
        <div>
          <h2 className="text-xl font-bold mb-2">Selected Date: {selectedDate.toDateString()}</h2>
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
      )}
    </div>
  );
};

export default Agenda;
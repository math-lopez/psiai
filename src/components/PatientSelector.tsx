"use client";

import React, { useState } from 'react';
import { Input } from '@shadcn/ui/input';

interface Patient {
  id: string;
  name: string;
}

interface PatientSelectorProps {
  patients: Patient[];
  onSelect: (patient: Patient) => void;
}

const PatientSelector: React.FC<PatientSelectorProps> = ({ patients, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Input
        type="text"
        placeholder="Search for a patient..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <ul>
        {filteredPatients.map(patient => (
          <li key={patient.id} onClick={() => onSelect(patient)}>
            {patient.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PatientSelector;
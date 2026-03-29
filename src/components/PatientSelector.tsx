"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";

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
        placeholder="Buscar por um paciente..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <ul className="space-y-2">
        {filteredPatients.map(patient => (
          <li 
            key={patient.id} 
            onClick={() => onSelect(patient)}
            className="p-3 bg-white border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors font-medium"
          >
            {patient.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PatientSelector;
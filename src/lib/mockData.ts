import { Patient, Session, DashboardStats, User } from '../types';

export const mockUser: User = {
  id: '1',
  name: 'Dra. Mariana Silva',
  crp: '06/123456',
  email: 'mariana.silva@psiai.com.br',
  phone: '(11) 98888-7777',
};

export const mockPatients: Patient[] = [
  {
    id: 'p1',
    fullName: 'João Ricardo Pereira',
    birthDate: '1990-05-15',
    cpf: '123.456.789-00',
    phone: '(11) 91234-5678',
    email: 'joao.ricardo@email.com',
    gender: 'Masculino',
    status: 'ativo',
    createdAt: '2023-10-01',
    updatedAt: '2024-03-20',
    notes: 'Paciente apresenta ansiedade generalizada.'
  },
  {
    id: 'p2',
    fullName: 'Ana Beatriz Souza',
    birthDate: '1985-08-22',
    phone: '(11) 92222-3333',
    email: 'ana.souza@email.com',
    gender: 'Feminino',
    status: 'ativo',
    createdAt: '2023-11-15',
    updatedAt: '2024-03-18',
  },
  {
    id: 'p3',
    fullName: 'Carlos Eduardo Lima',
    birthDate: '1978-12-10',
    phone: '(11) 94444-5555',
    email: 'carlos.lima@email.com',
    gender: 'Masculino',
    status: 'inativo',
    createdAt: '2023-09-10',
    updatedAt: '2023-12-05',
  }
];

export const mockSessions: Session[] = [
  {
    id: 's1',
    patientId: 'p1',
    patientName: 'João Ricardo Pereira',
    sessionDate: '2024-03-20T14:00:00',
    durationMinutes: 50,
    recordType: 'ambos',
    manualNotes: 'O paciente relatou melhoras no sono após iniciar a técnica de relaxamento.',
    audioFileName: 'sessao_joao_2003.mp3',
    processingStatus: 'concluido',
    transcript: 'Olá, hoje vamos falar sobre como foi sua semana... Senti que dormi melhor, as técnicas ajudaram muito.',
    highlights: ['Melhora no sono', 'Uso de técnicas de relaxamento', 'Redução de episódios de pânico'],
    nextSteps: 'Continuar monitoramento do sono e introduzir diário de pensamentos.',
    createdBy: '1',
    createdAt: '2024-03-20',
    updatedAt: '2024-03-20',
  },
  {
    id: 's2',
    patientId: 'p2',
    patientName: 'Ana Beatriz Souza',
    sessionDate: '2024-03-21T10:00:00',
    durationMinutes: 45,
    recordType: 'audio',
    processingStatus: 'processando',
    createdBy: '1',
    createdAt: '2024-03-21',
    updatedAt: '2024-03-21',
  },
  {
    id: 's3',
    patientId: 'p1',
    patientName: 'João Ricardo Pereira',
    sessionDate: '2024-03-13T14:00:00',
    durationMinutes: 50,
    recordType: 'manual',
    manualNotes: 'Sessão focada em conflitos familiares.',
    processingStatus: 'concluido',
    createdBy: '1',
    createdAt: '2024-03-13',
    updatedAt: '2024-03-13',
  }
];

export const mockStats: DashboardStats = {
  totalPatients: 12,
  totalSessions: 48,
  pendingProcessing: 2,
  completedSessions: 46,
};
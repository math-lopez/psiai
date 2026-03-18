import { mockSessions, mockStats } from "@/lib/mockData";
import { Session, DashboardStats } from "@/types";

export const sessionService = {
  list: async (): Promise<Session[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockSessions;
  },

  getById: async (id: string): Promise<Session | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockSessions.find(s => s.id === id);
  },

  create: async (session: any): Promise<Session> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      ...session,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      processingStatus: 'processando'
    };
  },

  getStats: async (): Promise<DashboardStats> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockStats;
  }
};
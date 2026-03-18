import { mockUser } from "@/lib/mockData";
import { User } from "@/types";

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // Simula atraso de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Login attempt:", email);
    return mockUser;
  },

  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Logged out");
  },

  getCurrentUser: async (): Promise<User | null> => {
    return mockUser;
  }
};
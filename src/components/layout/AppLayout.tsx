"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export const AppLayout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fecha o menu mobile ao trocar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        <main className="flex-1 overflow-x-hidden p-4 md:p-8 lg:p-10">
          <div key={location.pathname} className="page-transition max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Sidebar Mobile via Sheet/Drawer logic embutida para simplicidade */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[280px] bg-white shadow-2xl animate-in slide-in-from-left duration-300">
            <Sidebar isMobile onpjClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
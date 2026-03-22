"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative p-3 text-slate-500 bg-white dark:bg-slate-900 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 transition-all hover:scale-105 active:scale-95 focus:outline-none"
    >
      <Sun className="h-5.5 w-5.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute top-3 left-3 h-5.5 w-5.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Alternar tema</span>
    </button>
  );
}
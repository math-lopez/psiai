"use client";

import { useMemo, useState } from "react";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";
import { Session } from "@/types";
import { subDays, format, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityChartProps {
  sessions: Session[];
}

export const ActivityChart = ({ sessions }: ActivityChartProps) => {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

  const data = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const count = sessions.filter(s => 
        isSameDay(startOfDay(new Date(s.session_date)), startOfDay(date))
      ).length;
      
      return {
        name: format(date, "EEE", { locale: ptBR }).replace('.', ''),
        fullDate: format(date, "dd/MM"),
        quantidade: count,
      };
    });
    return last7Days;
  }, [sessions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button 
          variant={chartType === 'bar' ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => setChartType('bar')}
          className="h-8 rounded-xl px-3 gap-2 text-[10px] font-black uppercase tracking-wider"
        >
          <LayoutDashboard className="h-3 w-3" /> Colunas
        </Button>
        <Button 
          variant={chartType === 'area' ? 'secondary' : 'ghost'} 
          size="sm" 
          onClick={() => setChartType('area')}
          className="h-8 rounded-xl px-3 gap-2 text-[10px] font-black uppercase tracking-wider"
        >
          <TrendingUp className="h-3 w-3" /> Tendência
        </Button>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                allowDecimals={false}
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 shadow-xl border border-slate-100 rounded-xl">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{payload[0].payload.fullDate}</p>
                        <p className="text-sm font-black text-indigo-600">{payload[0].value} sessões</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="quantidade" 
                radius={[6, 6, 6, 6]} 
                barSize={32}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.quantidade > 0 ? '#6366f1' : '#e2e8f0'} 
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                allowDecimals={false}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 shadow-xl border border-slate-100 rounded-xl">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{payload[0].payload.fullDate}</p>
                        <p className="text-sm font-black text-indigo-600">{payload[0].value} sessões</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="quantidade" 
                stroke="#6366f1" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorQty)" 
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
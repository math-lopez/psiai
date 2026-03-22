import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Book, Sparkles, Calendar, MessageSquare, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { diaryService } from "@/services/diaryService";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PatientDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<any>(null);
  const [prompts, setPrompts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ctx = await diaryService.getPatientContext();
        if (ctx) {
          setContext(ctx);
          const p = await diaryService.listPrompts(ctx.patientId);
          setPrompts(p.filter(x => x.status === 'active'));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">Olá, {user?.user_metadata?.full_name || 'Paciente'}</h1>
          <p className="text-indigo-100 font-medium">Este é o seu espaço seguro para reflexão e crescimento.</p>
        </div>
        <Sparkles className="absolute right-[-20px] bottom-[-20px] h-48 w-48 text-white/10 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all group">
          <CardHeader className="bg-slate-50/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Book className="h-5 w-5 text-indigo-500" /> Meu Diário
            </CardTitle>
            <CardDescription>Registre seus sentimentos e pensamentos.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Link to="/meu-diario">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl gap-2 font-bold group-hover:scale-[1.02] transition-transform">
                Escrever Novo Registro <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Sparkles className="h-5 w-5 text-amber-500" /> Atividades Propostas
            </CardTitle>
            <CardDescription>Exercícios sugeridos pelo seu psicólogo.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {prompts.length > 0 ? prompts.map((p) => (
                <div key={p.id} className="p-3 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                  <p className="text-sm font-bold text-amber-900">{p.title}</p>
                  <Link to="/meu-diario">
                    <Button size="sm" variant="ghost" className="text-amber-700 hover:bg-amber-100 h-8">Fazer</Button>
                  </Link>
                </div>
              )) : (
                <p className="text-center py-4 text-xs text-slate-400 italic">Nenhuma atividade pendente.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;
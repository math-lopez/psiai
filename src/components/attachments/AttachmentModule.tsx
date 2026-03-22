"use client";

import React, { useState, useEffect } from "react";
import { PatientAttachment, AttachmentVisibility } from "@/types/attachment";
import { attachmentService } from "@/services/attachmentService";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  Eye, 
  EyeOff, 
  Loader2, 
  File, 
  MoreVertical,
  Plus,
  Search,
  Cloud,
  Lock,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AttachmentModuleProps {
  patientId: string;
  psychologistId: string;
  role: 'psychologist' | 'patient';
}

export const AttachmentModule = ({ patientId, psychologistId, role }: AttachmentModuleProps) => {
  const [attachments, setAttachments] = useState<PatientAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal Upload
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<AttachmentVisibility>('private_to_psychologist');

  const fetchAttachments = async () => {
    try {
      const data = await attachmentService.list(patientId);
      setAttachments(data);
    } catch (e) {
      console.error("Erro ao carregar arquivos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [patientId]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await attachmentService.upload(
        patientId, 
        psychologistId, 
        selectedFile, 
        role === 'patient' ? 'shared_with_patient' : visibility,
        role
      );
      showSuccess("Arquivo enviado com sucesso!");
      setIsUploadOpen(false);
      setSelectedFile(null);
      fetchAttachments();
    } catch (e) {
      showError("Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (path: string, fileName: string) => {
    try {
      const url = await attachmentService.getDownloadUrl(path);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      showError("Erro ao baixar arquivo.");
    }
  };

  const handleDelete = async (attachment: PatientAttachment) => {
    if (!confirm("Excluir este arquivo permanentemente?")) return;
    try {
      await attachmentService.delete(attachment);
      showSuccess("Arquivo removido.");
      fetchAttachments();
    } catch (e) {
      showError("Erro ao remover arquivo.");
    }
  };

  const filtered = attachments.filter(a => 
    a.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar documentos..." 
            className="pl-10 h-11 rounded-2xl border-slate-100 bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          onClick={() => setIsUploadOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-11 px-6 shadow-xl shadow-indigo-100 gap-2 font-black w-full md:w-auto"
        >
          <Upload className="h-4 w-4" /> Subir Arquivo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length > 0 ? filtered.map((item) => (
          <Card key={item.id} className="group border-none shadow-sm hover:shadow-md hover:border-indigo-100 border bg-white rounded-[32px] overflow-hidden transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-1">
                  {role === 'psychologist' && (
                    item.visibility === 'shared_with_patient' ? 
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg" title="Compartilhado"><Share2 className="h-3.5 w-3.5" /></div> :
                    <div className="p-1.5 bg-slate-100 text-slate-400 rounded-lg" title="Privado"><Lock className="h-3.5 w-3.5" /></div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl">
                      <DropdownMenuItem onClick={() => handleDownload(item.file_path, item.file_name)} className="font-bold gap-2">
                        <Download className="h-4 w-4" /> Baixar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(item)} className="text-red-600 font-bold gap-2">
                        <Trash2 className="h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 truncate pr-4" title={item.file_name}>{item.file_name}</h4>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                  {format(new Date(item.created_at), "dd/MM/yyyy")} • {(item.file_size / 1024).toFixed(1)} KB
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                 <span className={cn(
                   "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                   item.uploaded_by === 'patient' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500"
                 )}>
                   De: {item.uploaded_by === 'patient' ? 'Paciente' : 'Você'}
                 </span>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
             <Cloud className="h-12 w-12 text-slate-200 mx-auto mb-4" />
             <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Nenhum arquivo encontrado.</p>
          </div>
        )}
      </div>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <Upload className="text-indigo-600 h-6 w-6" /> Subir Documento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400">Selecionar Arquivo</Label>
              <Input 
                type="file" 
                className="h-12 rounded-2xl border-slate-200 pt-2.5 font-bold file:mr-4 file:bg-indigo-50 file:text-indigo-600 file:border-none file:font-black file:uppercase file:text-[10px] file:px-3 file:py-1 file:rounded-lg" 
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>

            {role === 'psychologist' ? (
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400">Quem pode acessar?</Label>
                <RadioGroup value={visibility} onValueChange={(v: any) => setVisibility(v)} className="grid grid-cols-2 gap-3">
                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                    visibility === 'private_to_psychologist' ? "bg-slate-50 border-slate-300" : "bg-white border-slate-100"
                  )}>
                    <RadioGroupItem value="private_to_psychologist" id="v1" />
                    <Label htmlFor="v1" className="text-xs font-bold cursor-pointer flex items-center gap-2"><Lock className="h-3 w-3" /> Só Eu</Label>
                  </div>
                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                    visibility === 'shared_with_patient' ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100"
                  )}>
                    <RadioGroupItem value="shared_with_patient" id="v2" />
                    <Label htmlFor="v2" className="text-xs font-bold cursor-pointer flex items-center gap-2"><Share2 className="h-3 w-3" /> Ambos</Label>
                  </div>
                </RadioGroup>
              </div>
            ) : (
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                <Share2 className="h-4 w-4 text-indigo-600 mt-0.5" />
                <p className="text-[10px] font-bold text-indigo-800 leading-relaxed">
                  Arquivos enviados por você são automaticamente compartilhados com seu psicólogo para fins de acompanhamento.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-12 font-black shadow-lg shadow-indigo-100"
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";

interface FileUploadZoneProps {
  companyId: string;
  onUploadComplete?: (fileUrl: string) => void;
}

export const FileUploadZone = ({ companyId, onUploadComplete }: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validar tipo de arquivo
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não suportado. Use CSV, XLSX ou PDF.");
      return;
    }

    // Validar tamanho (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Tamanho máximo: 20MB");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Upload para Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('financial-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('financial-documents')
        .getPublicUrl(fileName);

      setUploadedFile({
        name: file.name,
        url: publicUrl
      });

      toast.success("Arquivo enviado com sucesso!");
      onUploadComplete?.(publicUrl);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error("Erro ao enviar arquivo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!uploadedFile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Extrair path do arquivo da URL
      const urlParts = uploadedFile.url.split('/');
      const filePath = urlParts.slice(-2).join('/');

      const { error } = await supabase.storage
        .from('financial-documents')
        .remove([filePath]);

      if (error) throw error;

      setUploadedFile(null);
      toast.success("Arquivo removido");
    } catch (error: any) {
      console.error('Error removing file:', error);
      toast.error("Erro ao remover arquivo: " + error.message);
    }
  };

  if (uploadedFile) {
    return (
      <Card className="p-4 bg-success/10 border-success/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <div>
              <p className="font-medium text-sm">{uploadedFile.name}</p>
              <p className="text-xs text-muted-foreground">Arquivo enviado com sucesso</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`p-6 border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-center space-y-4">
        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
          uploading ? 'bg-primary/20' : 'bg-muted'
        }`}>
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-1">
            {uploading ? 'Enviando arquivo...' : 'Upload de Dados Históricos'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Arraste um arquivo ou clique para selecionar
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="outline" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            CSV
          </Badge>
          <Badge variant="outline" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            XLSX
          </Badge>
          <Badge variant="outline" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            PDF
          </Badge>
        </div>

        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".csv,.xlsx,.xls,.pdf"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={uploading}
        >
          Selecionar Arquivo
        </Button>

        <p className="text-xs text-muted-foreground">
          Opcional: DRE, planilha de vendas, faturamento, etc. (máx. 20MB)
        </p>
      </div>
    </Card>
  );
};
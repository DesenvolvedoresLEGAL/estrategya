import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, FileUp, AlertCircle, Save } from "lucide-react";
import { FileUploadZone } from "./FileUploadZone";
import { SegmentQuestionsSection } from "./SegmentQuestionsSection";
import { Sparkles } from "lucide-react";
import { companyContextSchema } from "@/lib/validations/wizard";
import { z } from "zod";
import { ContextualHelp } from "./ContextualHelp";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { useAnalytics } from "@/hooks/useAnalytics";

const segmentos = [
  "Eventos",
  "Telecom",
  "Serviços",
  "SaaS",
  "Indústria",
  "Educação",
  "Saúde",
  "Varejo",
  "Outro"
];

const modelos = ["B2B", "B2C", "Híbrido"];

interface Props {
  initialData: any;
  onNext: (data: any) => void;
  onSaveAndExit?: () => Promise<void>;
  userId: string;
}

export const EtapaContexto = ({ initialData, onNext, onSaveAndExit, userId }: Props) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    cnpj: initialData?.cnpj || "",
    whatsapp_phone: initialData?.whatsapp_phone || "",
    segment: initialData?.segment || "",
    model: initialData?.model || "",
    size_team: initialData?.size_team || "",
    region: initialData?.region || "",
    main_challenge: initialData?.main_challenge || "",
    mission: initialData?.mission || "",
    vision: initialData?.vision || "",
    values: initialData?.values || "",
  });
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [segmentQuestions, setSegmentQuestions] = useState<any[]>([]);
  const [segmentAnswers, setSegmentAnswers] = useState<Record<string, any>>(
    initialData?.segment_specific_data || {}
  );
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  const { canCreateCompany } = useSubscriptionLimits(undefined);
  const { trackLimitReached, trackFeatureBlocked } = useAnalytics();

  const handleSegmentChange = async (segment: string) => {
    setFormData({ ...formData, segment });
    if (errors.segment) setErrors({ ...errors, segment: "" });
    
    if (segment) {
      setLoadingQuestions(true);
      try {
        const { data, error } = await supabase.functions.invoke('ai-segment-customization', {
          body: { 
            action: 'generate_questions', 
            segment,
            company_context: formData 
          }
        });
        
        if (error) throw error;
        setSegmentQuestions(data.questions || []);
      } catch (error) {
        console.error('Error loading segment questions:', error);
        toast.error('Erro ao carregar perguntas específicas do segmento');
      } finally {
        setLoadingQuestions(false);
      }
    } else {
      setSegmentQuestions([]);
    }
  };

  const handleSegmentAnswerChange = (field: string, value: string) => {
    setSegmentAnswers({ ...segmentAnswers, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validação com Zod
    try {
      companyContextSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error("Por favor, corrija os erros no formulário");
        return;
      }
    }

    setLoading(true);

    try {
      let companyId = initialData?.id;

      const sanitizedData = {
        name: formData.name.trim(),
        cnpj: formData.cnpj.trim(),
        whatsapp_phone: formData.whatsapp_phone.trim(),
        segment: formData.segment,
        model: formData.model,
        size_team: formData.size_team ? parseInt(formData.size_team) : null,
        region: formData.region?.trim() || null,
        main_challenge: formData.main_challenge?.trim() || null,
        mission: formData.mission?.trim() || null,
        vision: formData.vision?.trim() || null,
        values: formData.values?.trim() || null,
        segment_specific_data: segmentAnswers,
      };

      if (companyId) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('companies')
          .update(sanitizedData)
          .eq('id', companyId);

        if (error) throw error;
      } else {
        // Criar nova empresa - verificar limites de subscription
        const canCreate = await canCreateCompany();
        
        if (!canCreate) {
          trackLimitReached("companies", "free", "company_creation");
          trackFeatureBlocked("multiple_companies", "free", "pro");
          setShowUpgradePrompt(true);
          return;
        }
        
        const { data, error } = await supabase
          .from('companies')
          .insert({
            ...sanitizedData,
            owner_user_id: userId,
          })
          .select()
          .single();

        if (error) throw error;
        companyId = data.id;
      }

      toast.success("Contexto salvo com sucesso!");
      onNext({ ...formData, ...sanitizedData, id: companyId });
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast.error(error.message || "Erro ao salvar dados da empresa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">Conte-nos sobre sua empresa</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Vamos começar entendendo o contexto do seu negócio
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Por favor, corrija os erros destacados no formulário.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="name">Nome da Empresa *</Label>
              <ContextualHelp
                label="Nome da Empresa"
                description="Digite o nome oficial registrado da sua empresa"
                examples={[
                  "LEGAL Telecom",
                  "TechCorp Brasil Ltda",
                  "Eventos Premium SP"
                ]}
              />
            </div>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              placeholder="Ex: LEGAL Telecom"
              className={errors.name ? "border-destructive" : ""}
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <ContextualHelp
                  label="CNPJ"
                  description="CNPJ da empresa (obrigatório para validação)"
                  examples={[
                    "00.000.000/0000-00",
                    "12.345.678/0001-90"
                  ]}
                />
              </div>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => {
                  setFormData({ ...formData, cnpj: e.target.value });
                  if (errors.cnpj) setErrors({ ...errors, cnpj: "" });
                }}
                placeholder="00.000.000/0000-00"
                className={errors.cnpj ? "border-destructive" : ""}
                maxLength={18}
                required
              />
              {errors.cnpj && (
                <p className="text-sm text-destructive">{errors.cnpj}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="whatsapp_phone">Telefone WhatsApp *</Label>
                <ContextualHelp
                  label="WhatsApp"
                  description="Telefone WhatsApp para contato (obrigatório)"
                  examples={[
                    "(11) 99999-9999",
                    "+55 11 98765-4321"
                  ]}
                />
              </div>
              <Input
                id="whatsapp_phone"
                value={formData.whatsapp_phone}
                onChange={(e) => {
                  setFormData({ ...formData, whatsapp_phone: e.target.value });
                  if (errors.whatsapp_phone) setErrors({ ...errors, whatsapp_phone: "" });
                }}
                placeholder="(00) 90000-0000"
                className={errors.whatsapp_phone ? "border-destructive" : ""}
                maxLength={20}
                required
              />
              {errors.whatsapp_phone && (
                <p className="text-sm text-destructive">{errors.whatsapp_phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="segment">Segmento *</Label>
                <ContextualHelp
                  label="Segmento"
                  description="Escolha o setor principal de atuação"
                  examples={[
                    "Telecom: provedores de internet, telefonia",
                    "SaaS: software como serviço",
                    "Eventos: organização e produção"
                  ]}
                />
              </div>
              <Select
                value={formData.segment}
                onValueChange={handleSegmentChange}
                required
              >
                <SelectTrigger className={errors.segment ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione o segmento" />
                </SelectTrigger>
                <SelectContent>
                  {segmentos.map((seg) => (
                    <SelectItem key={seg} value={seg.toLowerCase()}>
                      {seg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.segment && (
                <p className="text-sm text-destructive">{errors.segment}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="model">Modelo de Negócio *</Label>
                <ContextualHelp
                  label="Modelo de Negócio"
                  description="Como sua empresa gera receita"
                  examples={[
                    "B2B: vende para outras empresas",
                    "B2C: vende para consumidor final",
                    "Híbrido: atende ambos os públicos"
                  ]}
                />
              </div>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData({ ...formData, model: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelos.map((mod) => (
                    <SelectItem key={mod} value={mod}>
                      {mod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="size_team">Tamanho do Time</Label>
                <ContextualHelp
                  label="Tamanho do Time"
                  description="Número total de colaboradores"
                  examples={["5 pessoas", "15 pessoas", "50+ pessoas"]}
                />
              </div>
              <Input
                id="size_team"
                type="number"
                value={formData.size_team}
                onChange={(e) => setFormData({ ...formData, size_team: e.target.value })}
                placeholder="Ex: 15"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="region">Região de Atuação</Label>
                <ContextualHelp
                  label="Região de Atuação"
                  description="Onde sua empresa atua geograficamente"
                  examples={[
                    "Sul do Brasil",
                    "Grande São Paulo",
                    "Nacional",
                    "América Latina"
                  ]}
                />
              </div>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="Ex: Sul do Brasil"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="main_challenge">Principal Desafio Atual</Label>
              <ContextualHelp
                label="Principal Desafio"
                description="O maior obstáculo que sua empresa enfrenta agora"
                examples={[
                  "Escalabilidade operacional limitada",
                  "Competição acirrada no mercado",
                  "Retenção de clientes baixa"
                ]}
              />
            </div>
            <Textarea
              id="main_challenge"
              value={formData.main_challenge}
              onChange={(e) => setFormData({ ...formData, main_challenge: e.target.value })}
              placeholder="Descreva o maior desafio que sua empresa enfrenta hoje..."
              rows={4}
            />
          </div>

          <div className="border-t pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Missão, Visão e Valores</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Defina o propósito e direcionamento estratégico da sua empresa
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="mission">Missão</Label>
                <ContextualHelp
                  label="Missão"
                  description="O propósito fundamental da empresa - por que existe"
                  examples={[
                    "Conectar pessoas através de tecnologia acessível",
                    "Transformar eventos em experiências memoráveis",
                    "Simplificar a gestão de negócios com software inteligente"
                  ]}
                />
              </div>
              <Textarea
                id="mission"
                value={formData.mission}
                onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                placeholder="Por que sua empresa existe? Qual é o propósito fundamental?"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.mission.length}/500 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="vision">Visão</Label>
                <ContextualHelp
                  label="Visão"
                  description="Onde a empresa quer chegar - estado futuro desejado"
                  examples={[
                    "Ser líder regional em soluções de telecom até 2027",
                    "Referência nacional em eventos corporativos em 3 anos",
                    "Top 5 SaaS de gestão na América Latina até 2026"
                  ]}
                />
              </div>
              <Textarea
                id="vision"
                value={formData.vision}
                onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                placeholder="Onde sua empresa quer chegar? O que deseja se tornar?"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.vision.length}/500 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="values">Valores</Label>
                <ContextualHelp
                  label="Valores"
                  description="Princípios que guiam decisões e comportamentos"
                  examples={[
                    "Transparência, Inovação, Foco no Cliente",
                    "Excelência, Colaboração, Sustentabilidade",
                    "Integridade, Agilidade, Resultados"
                  ]}
                />
              </div>
              <Textarea
                id="values"
                value={formData.values}
                onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                placeholder="Quais são os princípios que guiam as decisões e comportamentos?"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.values.length}/500 caracteres
              </p>
            </div>
          </div>

          {formData.segment && (
            <SegmentQuestionsSection
              questions={segmentQuestions}
              answers={segmentAnswers}
              onChange={handleSegmentAnswerChange}
              loading={loadingQuestions}
              segment={formData.segment}
            />
          )}

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Dados Históricos</h3>
                <Badge variant="outline" className="ml-2">Opcional</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Faça upload de planilhas ou relatórios financeiros para enriquecer a análise estratégica
            </p>
            
            {formData.name && (
              <FileUploadZone 
                companyId={initialData?.id || 'temp'}
                onUploadComplete={(url) => setUploadedFileUrl(url)}
              />
            )}
            
            {!formData.name && (
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground text-center">
                  Preencha o nome da empresa para habilitar o upload
                </p>
              </Card>
            )}
          </div>

          <UpgradePrompt
            open={showUpgradePrompt}
            onOpenChange={setShowUpgradePrompt}
            limitType="companies"
          />

          <div className="flex justify-between">
            <div>
              {onSaveAndExit && (
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={onSaveAndExit}
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar e Sair
                </Button>
              )}
            </div>
            <Button type="submit" disabled={loading} size="lg">
              {loading ? "Salvando..." : "Próximo"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

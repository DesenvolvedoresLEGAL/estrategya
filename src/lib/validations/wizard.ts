import { z } from "zod";

// Validação para CNPJ (formato brasileiro)
const validateCNPJ = (cnpj: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Validação dos dígitos verificadores
  let length = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, length);
  const digits = cleanCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  length = length + 1;
  numbers = cleanCNPJ.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
};

// Validação para telefone WhatsApp (formato brasileiro)
const validateWhatsApp = (phone: string): boolean => {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/[^\d]/g, '');
  
  // Verifica se tem 12 ou 13 dígitos (com código do país)
  // Formato: +55 (DDD) 9XXXX-XXXX = 13 dígitos
  // Ou: (DDD) 9XXXX-XXXX = 11 dígitos
  return cleanPhone.length === 11 || cleanPhone.length === 13;
};

// Validação para Etapa 1: Contexto da Empresa
export const companyContextSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome da empresa deve ter pelo menos 2 caracteres")
    .max(100, "Nome da empresa deve ter no máximo 100 caracteres"),
  cnpj: z
    .string()
    .trim()
    .min(1, "CNPJ é obrigatório")
    .refine(validateCNPJ, "CNPJ inválido. Use o formato: 00.000.000/0000-00"),
  whatsapp_phone: z
    .string()
    .trim()
    .min(1, "Telefone WhatsApp é obrigatório")
    .refine(validateWhatsApp, "Telefone inválido. Use o formato: (00) 90000-0000"),
  segment: z
    .string()
    .trim()
    .min(1, "Selecione um segmento"),
  model: z
    .string()
    .trim()
    .min(1, "Selecione um modelo de negócio"),
  size_team: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined))
    .refine(
      (val) => val === undefined || (val > 0 && val < 100000),
      "Tamanho do time deve ser um número válido"
    ),
  region: z
    .string()
    .trim()
    .max(100, "Região deve ter no máximo 100 caracteres")
    .optional(),
  main_challenge: z
    .string()
    .trim()
    .max(1000, "Desafio principal deve ter no máximo 1000 caracteres")
    .optional(),
  mission: z
    .string()
    .trim()
    .max(500, "Missão deve ter no máximo 500 caracteres")
    .optional(),
  vision: z
    .string()
    .trim()
    .max(500, "Visão deve ter no máximo 500 caracteres")
    .optional(),
  values: z
    .string()
    .trim()
    .max(500, "Valores devem ter no máximo 500 caracteres")
    .optional(),
});

// Validação para Etapa 2: SWOT
export const swotSchema = z.object({
  strengths: z
    .string()
    .trim()
    .min(10, "Forças devem ter pelo menos 10 caracteres")
    .max(2000, "Forças devem ter no máximo 2000 caracteres"),
  weaknesses: z
    .string()
    .trim()
    .min(10, "Fraquezas devem ter pelo menos 10 caracteres")
    .max(2000, "Fraquezas devem ter no máximo 2000 caracteres"),
  opportunities: z
    .string()
    .trim()
    .min(10, "Oportunidades devem ter pelo menos 10 caracteres")
    .max(2000, "Oportunidades devem ter no máximo 2000 caracteres"),
  threats: z
    .string()
    .trim()
    .min(10, "Ameaças devem ter pelo menos 10 caracteres")
    .max(2000, "Ameaças devem ter no máximo 2000 caracteres"),
});

// Validação para Etapa 6: Priorização ICE
export const iceScoreSchema = z.object({
  impact_score: z
    .number()
    .int()
    .min(1, "Impacto deve ser entre 1 e 10")
    .max(10, "Impacto deve ser entre 1 e 10"),
  confidence_score: z
    .number()
    .int()
    .min(1, "Confiança deve ser entre 1 e 10")
    .max(10, "Confiança deve ser entre 1 e 10"),
  ease_score: z
    .number()
    .int()
    .min(1, "Facilidade deve ser entre 1 e 10")
    .max(10, "Facilidade deve ser entre 1 e 10"),
});

// Validação para Etapa 8: Métricas
export const metricSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nome da métrica deve ter pelo menos 3 caracteres")
    .max(200, "Nome da métrica deve ter no máximo 200 caracteres"),
  target: z
    .string()
    .trim()
    .max(100, "Meta deve ter no máximo 100 caracteres")
    .optional(),
  current_value: z
    .string()
    .trim()
    .max(100, "Valor atual deve ter no máximo 100 caracteres")
    .optional(),
  period: z
    .string()
    .trim()
    .max(50, "Período deve ter no máximo 50 caracteres")
    .optional(),
  source: z
    .string()
    .trim()
    .max(200, "Fonte deve ter no máximo 200 caracteres")
    .optional(),
});

// Validação para 5W2H
export const fiveW2HSchema = z.object({
  what: z
    .string()
    .trim()
    .min(5, "O que (What) deve ter pelo menos 5 caracteres")
    .max(500, "O que (What) deve ter no máximo 500 caracteres"),
  why: z
    .string()
    .trim()
    .min(5, "Por que (Why) deve ter pelo menos 5 caracteres")
    .max(500, "Por que (Why) deve ter no máximo 500 caracteres"),
  where_location: z
    .string()
    .trim()
    .max(200, "Onde (Where) deve ter no máximo 200 caracteres")
    .optional(),
  when_deadline: z
    .string()
    .trim()
    .optional(),
  who: z
    .string()
    .trim()
    .max(200, "Quem (Who) deve ter no máximo 200 caracteres")
    .optional(),
  how: z
    .string()
    .trim()
    .max(500, "Como (How) deve ter no máximo 500 caracteres")
    .optional(),
  how_much: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine(
      (val) => val === undefined || val >= 0,
      "Quanto (How Much) deve ser um valor positivo"
    ),
});

// Helper para validação de dados da empresa
export const validateCompanyData = (data: any) => {
  if (!data || !data.id) {
    throw new Error("Dados da empresa são obrigatórios");
  }
  if (!data.name) {
    throw new Error("Nome da empresa é obrigatório");
  }
  if (!data.segment) {
    throw new Error("Segmento da empresa é obrigatório");
  }
  return true;
};

// Helper para validação de análise SWOT
export const validateSWOTData = (data: any) => {
  if (!data) {
    throw new Error("Análise SWOT é obrigatória");
  }
  if (!data.strengths || data.strengths.length === 0) {
    throw new Error("Forças (Strengths) são obrigatórias");
  }
  if (!data.weaknesses || data.weaknesses.length === 0) {
    throw new Error("Fraquezas (Weaknesses) são obrigatórias");
  }
  if (!data.opportunities || data.opportunities.length === 0) {
    throw new Error("Oportunidades (Opportunities) são obrigatórias");
  }
  if (!data.threats || data.threats.length === 0) {
    throw new Error("Ameaças (Threats) são obrigatórias");
  }
  return true;
};

export type CompanyContextFormData = z.infer<typeof companyContextSchema>;
export type SWOTFormData = z.infer<typeof swotSchema>;
export type ICEScoreFormData = z.infer<typeof iceScoreSchema>;
export type MetricFormData = z.infer<typeof metricSchema>;
export type FiveW2HFormData = z.infer<typeof fiveW2HSchema>;

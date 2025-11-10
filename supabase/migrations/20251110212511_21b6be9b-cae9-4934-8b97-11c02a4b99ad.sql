-- Add CNPJ and WhatsApp phone fields to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS cnpj text,
ADD COLUMN IF NOT EXISTS whatsapp_phone text;

-- Add comments for documentation
COMMENT ON COLUMN public.companies.cnpj IS 'CNPJ da empresa (formato: 00.000.000/0000-00)';
COMMENT ON COLUMN public.companies.whatsapp_phone IS 'Telefone WhatsApp da empresa (formato: +55 11 99999-9999)';
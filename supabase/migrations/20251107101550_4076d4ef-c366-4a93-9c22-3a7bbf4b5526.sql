-- Create financial_data table for historical data
CREATE TABLE financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL,
  revenue DECIMAL(15,2),
  expenses DECIMAL(15,2),
  profit DECIMAL(15,2),
  customers_count INTEGER,
  sales_volume DECIMAL(15,2),
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE financial_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view financial data of their companies"
ON financial_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = financial_data.company_id
    AND companies.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert financial data for their companies"
ON financial_data FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = financial_data.company_id
    AND companies.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update financial data of their companies"
ON financial_data FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = financial_data.company_id
    AND companies.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete financial data of their companies"
ON financial_data FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = financial_data.company_id
    AND companies.owner_user_id = auth.uid()
  )
);

-- Create storage bucket for financial documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('financial-documents', 'financial-documents', false);

-- Storage RLS policies
CREATE POLICY "Users can upload their company financial documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'financial-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their company financial documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'financial-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their company financial documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'financial-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
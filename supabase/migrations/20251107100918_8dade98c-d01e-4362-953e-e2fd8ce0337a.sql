-- Add Mission, Vision, Values to companies table
ALTER TABLE companies 
ADD COLUMN mission TEXT,
ADD COLUMN vision TEXT,
ADD COLUMN values TEXT;
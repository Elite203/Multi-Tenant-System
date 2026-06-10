-- Add has_sponsor_license field to companies table
ALTER TABLE public.companies 
ADD COLUMN has_sponsor_license boolean NOT NULL DEFAULT false;

-- Add index for better performance when filtering by sponsor license
CREATE INDEX idx_companies_sponsor_license ON public.companies(has_sponsor_license) WHERE has_sponsor_license = true;
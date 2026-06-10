-- Add missing columns to employee_work_profiles table
ALTER TABLE public.employee_work_profiles 
ADD COLUMN national_insurance_number text,
ADD COLUMN soc_number text,
ADD COLUMN work_email text,
ADD COLUMN work_phone text,
ADD COLUMN work_location text,
ADD COLUMN weekly_working_hours integer,
ADD COLUMN sponsored_by_company_id uuid REFERENCES public.companies(id),
ADD COLUMN start_date date,
ADD COLUMN end_date date;
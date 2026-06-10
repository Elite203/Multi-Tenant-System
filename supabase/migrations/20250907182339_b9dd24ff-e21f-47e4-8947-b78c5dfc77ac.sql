-- Phase 1: Critical Database & Infrastructure Fixes

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Create ROTA shift types table
CREATE TABLE IF NOT EXISTS public.rota_shift_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#3B82F6',
  duration_hours numeric NOT NULL DEFAULT 8,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create ROTA locations table
CREATE TABLE IF NOT EXISTS public.rota_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  address text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create ROTA shifts table
CREATE TABLE IF NOT EXISTS public.rota_shifts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_type_id uuid NOT NULL REFERENCES rota_shift_types(id),
  location_id uuid NOT NULL REFERENCES rota_locations(id),
  department_id uuid REFERENCES departments(id),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  break_minutes integer DEFAULT 0,
  notes text,
  created_by uuid REFERENCES employees(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create timesheet entries table
CREATE TABLE IF NOT EXISTS public.timesheet_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,
  end_time time,
  break_minutes integer DEFAULT 0,
  hours numeric NOT NULL DEFAULT 0,
  overtime_hours numeric DEFAULT 0,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  shift_id uuid REFERENCES rota_shifts(id),
  week_ending date NOT NULL,
  submitted_at timestamp with time zone,
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES employees(id),
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Create system settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.rota_shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rota_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rota_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ROTA tables
CREATE POLICY "Everyone can view shift types" ON public.rota_shift_types FOR SELECT USING (true);
CREATE POLICY "Admins and HR can manage shift types" ON public.rota_shift_types FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Everyone can view locations" ON public.rota_locations FOR SELECT USING (true);
CREATE POLICY "Admins and HR can manage locations" ON public.rota_locations FOR ALL USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins and HR can manage all shifts" ON public.rota_shifts FOR ALL USING (is_admin_or_hr(auth.uid()));
CREATE POLICY "Users can view own shifts" ON public.rota_shifts FOR SELECT USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for timesheet entries
CREATE POLICY "Admins and HR can manage all timesheets" ON public.timesheet_entries FOR ALL USING (is_admin_or_hr(auth.uid()));
CREATE POLICY "Users can manage own timesheets" ON public.timesheet_entries FOR ALL USING (employee_id = get_employee_id(auth.uid()));

-- Create RLS policies for system settings
CREATE POLICY "Admins can manage system settings" ON public.system_settings FOR ALL USING (is_admin_only(auth.uid()));
CREATE POLICY "Everyone can view system settings" ON public.system_settings FOR SELECT USING (true);

-- Insert default shift types
INSERT INTO public.rota_shift_types (name, description, color, duration_hours) VALUES
  ('Morning Shift', 'Standard morning shift', '#10B981', 8),
  ('Afternoon Shift', 'Standard afternoon shift', '#F59E0B', 8),
  ('Night Shift', 'Standard night shift', '#6366F1', 8),
  ('Part Time', 'Part time shift', '#8B5CF6', 4),
  ('Overtime', 'Overtime shift', '#EF4444', 4)
ON CONFLICT DO NOTHING;

-- Insert default locations
INSERT INTO public.rota_locations (name, address, description) VALUES
  ('Main Office', '123 Business Street, London, UK', 'Primary office location'),
  ('Branch Office', '456 Commerce Ave, Manchester, UK', 'Secondary office location'),
  ('Remote', 'Work from home', 'Remote work location'),
  ('Client Site', 'Various client locations', 'On-site client work')
ON CONFLICT DO NOTHING;

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('max_parent_companies', '{"value": 5}', 'Maximum number of parent companies allowed'),
  ('max_child_companies', '{"value": 50}', 'Maximum number of child companies per parent'),
  ('default_leave_allocation', '{"value": 25}', 'Default annual leave allocation in days'),
  ('rota_module_enabled', '{"value": true}', 'Enable/disable ROTA scheduling module'),
  ('default_shift_duration', '{"value": 8}', 'Default shift duration in hours'),
  ('shift_types', '{"value": []}', 'Available shift types'),
  ('work_locations', '{"value": []}', 'Available work locations')
ON CONFLICT (setting_key) DO NOTHING;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_rota_shifts_employee_date ON public.rota_shifts(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_rota_shifts_date_status ON public.rota_shifts(date, status);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_employee_date ON public.timesheet_entries(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_week_ending ON public.timesheet_entries(week_ending, status);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON public.employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);

-- Add triggers for updated_at columns
CREATE TRIGGER update_rota_shift_types_updated_at BEFORE UPDATE ON public.rota_shift_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rota_locations_updated_at BEFORE UPDATE ON public.rota_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rota_shifts_updated_at BEFORE UPDATE ON public.rota_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_timesheet_entries_updated_at BEFORE UPDATE ON public.timesheet_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
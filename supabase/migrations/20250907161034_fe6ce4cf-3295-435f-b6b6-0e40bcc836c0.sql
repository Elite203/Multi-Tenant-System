-- Create ROTA management system tables and types

-- Create shift status enum
CREATE TYPE public.shift_status_enum AS ENUM (
  'scheduled',
  'confirmed', 
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

-- Create rota_shift_types table
CREATE TABLE public.rota_shift_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  duration_hours INTEGER NOT NULL DEFAULT 8,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rota_locations table  
CREATE TABLE public.rota_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rota_shifts table
CREATE TABLE public.rota_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shift_type_id UUID NOT NULL REFERENCES public.rota_shift_types(id) ON DELETE RESTRICT,
  location_id UUID NOT NULL REFERENCES public.rota_locations(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status public.shift_status_enum NOT NULL DEFAULT 'scheduled',
  break_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.rota_shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rota_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rota_shifts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rota_shift_types
CREATE POLICY "Everyone can view shift types" 
ON public.rota_shift_types 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and HR can manage shift types" 
ON public.rota_shift_types 
FOR ALL 
USING (is_admin_or_hr(auth.uid()));

-- Create RLS policies for rota_locations
CREATE POLICY "Everyone can view locations" 
ON public.rota_locations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and HR can manage locations" 
ON public.rota_locations 
FOR ALL 
USING (is_admin_or_hr(auth.uid()));

-- Create RLS policies for rota_shifts
CREATE POLICY "Admins and HR can view all shifts" 
ON public.rota_shifts 
FOR SELECT 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Managers can view team shifts" 
ON public.rota_shifts 
FOR SELECT 
USING ((EXISTS ( 
  SELECT 1 FROM employees e 
  WHERE e.id = rota_shifts.employee_id 
  AND e.manager_id = get_employee_id(auth.uid())
)) OR is_admin_or_hr(auth.uid()));

CREATE POLICY "Employees can view own shifts" 
ON public.rota_shifts 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Admins and HR can manage all shifts" 
ON public.rota_shifts 
FOR ALL 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Managers can manage team shifts" 
ON public.rota_shifts 
FOR ALL 
USING ((EXISTS ( 
  SELECT 1 FROM employees e 
  WHERE e.id = rota_shifts.employee_id 
  AND e.manager_id = get_employee_id(auth.uid())
)) OR is_admin_or_hr(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_rota_shifts_employee_id ON public.rota_shifts(employee_id);
CREATE INDEX idx_rota_shifts_date ON public.rota_shifts(date);
CREATE INDEX idx_rota_shifts_status ON public.rota_shifts(status);
CREATE INDEX idx_rota_shifts_shift_type_id ON public.rota_shifts(shift_type_id);
CREATE INDEX idx_rota_shifts_location_id ON public.rota_shifts(location_id);

-- Create triggers for updated_at
CREATE TRIGGER update_rota_shift_types_updated_at
BEFORE UPDATE ON public.rota_shift_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rota_locations_updated_at
BEFORE UPDATE ON public.rota_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rota_shifts_updated_at
BEFORE UPDATE ON public.rota_shifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default shift types
INSERT INTO public.rota_shift_types (name, description, color, duration_hours) VALUES
('Morning Shift', 'Early morning work shift', '#3B82F6', 8),
('Afternoon Shift', 'Afternoon work shift', '#10B981', 8),
('Evening Shift', 'Evening work shift', '#F59E0B', 8),
('Night Shift', 'Overnight work shift', '#8B5CF6', 8),
('Part Time', 'Part time shift', '#EF4444', 4);

-- Insert default locations
INSERT INTO public.rota_locations (name, address, description) VALUES
('Main Office', '123 Business Street, City', 'Primary office location'),
('Warehouse', '456 Industrial Avenue, City', 'Storage and distribution center'),
('Remote', 'Various locations', 'Work from home or remote work');

-- Create function to get rota statistics
CREATE OR REPLACE FUNCTION public.get_rota_statistics(
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT CURRENT_DATE + INTERVAL '6 days'
)
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_shifts', (
      SELECT COUNT(*) 
      FROM rota_shifts 
      WHERE date BETWEEN start_date AND end_date
    ),
    'unique_employees', (
      SELECT COUNT(DISTINCT employee_id) 
      FROM rota_shifts 
      WHERE date BETWEEN start_date AND end_date
    ),
    'total_hours', (
      SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600 - COALESCE(break_minutes, 0) / 60.0
      ), 0)
      FROM rota_shifts 
      WHERE date BETWEEN start_date AND end_date
    ),
    'confirmed_shifts', (
      SELECT COUNT(*) 
      FROM rota_shifts 
      WHERE date BETWEEN start_date AND end_date 
      AND status = 'confirmed'
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;
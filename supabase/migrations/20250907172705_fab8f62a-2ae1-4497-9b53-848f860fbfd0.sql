-- Create enhanced timesheet_entries table for daily time tracking
CREATE TABLE IF NOT EXISTS public.timesheet_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  profile_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  break_minutes INTEGER DEFAULT 0,
  hours NUMERIC(4,2) NOT NULL,
  overtime_hours NUMERIC(4,2) DEFAULT 0,
  description TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  week_ending DATE,
  shift_id UUID,
  manager_id UUID,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Enable RLS
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for timesheet entries
CREATE POLICY "Users can view own timesheet entries" 
ON public.timesheet_entries 
FOR SELECT 
USING (profile_id = auth.uid() OR employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Users can create own timesheet entries" 
ON public.timesheet_entries 
FOR INSERT 
WITH CHECK (profile_id = auth.uid() OR employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Users can update own timesheet entries" 
ON public.timesheet_entries 
FOR UPDATE 
USING (profile_id = auth.uid() OR employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Admins and HR can manage all timesheet entries" 
ON public.timesheet_entries 
FOR ALL 
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Managers can view team timesheet entries" 
ON public.timesheet_entries 
FOR SELECT 
USING (manager_id = get_employee_id(auth.uid()) OR is_admin_or_hr(auth.uid()));

CREATE POLICY "Managers can approve/reject team entries" 
ON public.timesheet_entries 
FOR UPDATE 
USING (manager_id = get_employee_id(auth.uid()) AND status IN ('submitted', 'approved', 'rejected'));

-- Create function to calculate hours from start/end time
CREATE OR REPLACE FUNCTION public.calculate_timesheet_hours(
  start_time TIME,
  end_time TIME,
  break_minutes INTEGER DEFAULT 0
)
RETURNS NUMERIC(4,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF start_time IS NULL OR end_time IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(
    (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) - (COALESCE(break_minutes, 0) / 60.0),
    2
  );
END;
$$;

-- Create function to import ROTA shifts to timesheets
CREATE OR REPLACE FUNCTION public.import_rota_to_timesheet(
  target_employee_id UUID,
  target_week_start DATE
)
RETURNS TABLE(
  timesheet_id UUID,
  shift_date DATE,
  hours_imported NUMERIC,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  shift_record RECORD;
  new_entry_id UUID;
  imported_hours NUMERIC;
BEGIN
  -- Loop through completed ROTA shifts for the week
  FOR shift_record IN 
    SELECT rs.*, rst.duration_hours
    FROM rota_shifts rs
    LEFT JOIN rota_shift_types rst ON rs.shift_type_id = rst.id
    WHERE rs.employee_id = target_employee_id
    AND rs.date BETWEEN target_week_start AND (target_week_start + INTERVAL '6 days')
    AND rs.status = 'completed'
  LOOP
    -- Calculate hours from shift
    imported_hours := COALESCE(
      calculate_timesheet_hours(shift_record.start_time, shift_record.end_time, shift_record.break_minutes),
      shift_record.duration_hours,
      8.0
    );
    
    -- Insert timesheet entry (ignore if already exists)
    INSERT INTO public.timesheet_entries (
      employee_id,
      date,
      start_time,
      end_time,
      break_minutes,
      hours,
      description,
      status,
      shift_id,
      week_ending
    )
    VALUES (
      target_employee_id,
      shift_record.date,
      shift_record.start_time,
      shift_record.end_time,
      COALESCE(shift_record.break_minutes, 0),
      imported_hours,
      COALESCE(shift_record.notes, 'Imported from ROTA'),
      'draft',
      shift_record.id,
      target_week_start
    )
    ON CONFLICT (employee_id, date) DO NOTHING
    RETURNING id INTO new_entry_id;
    
    -- Return results
    timesheet_id := new_entry_id;
    shift_date := shift_record.date;
    hours_imported := imported_hours;
    status := CASE WHEN new_entry_id IS NOT NULL THEN 'imported' ELSE 'already_exists' END;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- Create trigger to update timestamps
CREATE TRIGGER update_timesheet_entries_updated_at
BEFORE UPDATE ON public.timesheet_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get timesheet statistics
CREATE OR REPLACE FUNCTION public.get_timesheet_statistics(
  target_employee_id UUID DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  stats JSON;
  employee_filter UUID := COALESCE(target_employee_id, get_employee_id(auth.uid()));
BEGIN
  SELECT json_build_object(
    'total_hours', COALESCE(SUM(hours), 0),
    'total_overtime', COALESCE(SUM(overtime_hours), 0),
    'total_entries', COUNT(*),
    'approved_entries', COUNT(*) FILTER (WHERE status = 'approved'),
    'pending_entries', COUNT(*) FILTER (WHERE status IN ('draft', 'submitted')),
    'rejected_entries', COUNT(*) FILTER (WHERE status = 'rejected'),
    'weekly_target', 40.0,
    'avg_daily_hours', ROUND(COALESCE(AVG(hours), 0), 2)
  ) INTO stats
  FROM public.timesheet_entries
  WHERE employee_id = employee_filter
  AND (start_date IS NULL OR date >= start_date)
  AND (end_date IS NULL OR date <= end_date);
  
  RETURN stats;
END;
$$;
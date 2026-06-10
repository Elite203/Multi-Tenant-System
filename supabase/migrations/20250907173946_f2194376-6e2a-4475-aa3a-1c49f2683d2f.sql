-- Fix security warnings for organizational functions

-- Fix search path for existing functions that had warnings
CREATE OR REPLACE FUNCTION public.calculate_timesheet_hours(start_time time without time zone, end_time time without time zone, break_minutes integer DEFAULT 0)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF start_time IS NULL OR end_time IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(
    (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) - (COALESCE(break_minutes, 0) / 60.0),
    2
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_payslip_statuses()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update pending payslips to paid when pay date has passed
  UPDATE public.payslips 
  SET 
    status = 'paid',
    updated_at = now()
  WHERE 
    status = 'pending' 
    AND pay_date IS NOT NULL 
    AND pay_date <= CURRENT_DATE;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the update
  INSERT INTO public.audit_logs (
    table_name,
    action,
    new_values,
    user_id,
    created_at
  ) VALUES (
    'payslips',
    'BULK_UPDATE',
    json_build_object('updated_count', updated_count, 'action', 'auto_status_update'),
    NULL,
    now()
  );
  
  RETURN updated_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.import_rota_to_timesheet(target_employee_id uuid, target_week_start date)
 RETURNS TABLE(timesheet_id uuid, shift_date date, hours_imported numeric, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
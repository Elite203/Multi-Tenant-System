-- Fix search path for functions to resolve security warnings
ALTER FUNCTION public.calculate_timesheet_hours(TIME, TIME, INTEGER) SET search_path = public;
ALTER FUNCTION public.import_rota_to_timesheet(UUID, DATE) SET search_path = public;
ALTER FUNCTION public.get_timesheet_statistics(UUID, DATE, DATE) SET search_path = public;
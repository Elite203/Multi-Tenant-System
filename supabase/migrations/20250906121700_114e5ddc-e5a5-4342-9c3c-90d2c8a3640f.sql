-- Create leave_allocations table for system-wide leave configuration
CREATE TABLE IF NOT EXISTS public.leave_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type leave_type_enum NOT NULL,
  default_allocation NUMERIC NOT NULL DEFAULT 0,
  max_carry_forward NUMERIC NOT NULL DEFAULT 0,
  fiscal_year_start DATE NOT NULL DEFAULT '2024-04-01',
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(leave_type)
);

-- Insert default leave allocations
INSERT INTO public.leave_allocations (leave_type, default_allocation, max_carry_forward, requires_approval) VALUES
('annual', 25, 5, true),
('sick', 10, 0, false),
('maternity', 52, 0, true),
('paternity', 2, 0, true),
('bereavement', 5, 0, false),
('personal', 3, 0, true)
ON CONFLICT (leave_type) DO NOTHING;

-- Enable RLS
ALTER TABLE public.leave_allocations ENABLE ROW LEVEL SECURITY;

-- RLS policies for leave_allocations
CREATE POLICY "Everyone can view leave allocations" ON public.leave_allocations
  FOR SELECT USING (true);

CREATE POLICY "Admins and HR can manage leave allocations" ON public.leave_allocations
  FOR ALL USING (is_admin_or_hr(auth.uid()));

-- Create function to sync employee leave balances
CREATE OR REPLACE FUNCTION public.sync_employee_leave_balances(target_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allocation_record RECORD;
  employee_record RECORD;
  balance_count INTEGER := 0;
BEGIN
  -- Loop through all active employees and leave allocations
  FOR employee_record IN 
    SELECT id FROM employees WHERE status = 'active'
  LOOP
    FOR allocation_record IN 
      SELECT * FROM leave_allocations WHERE is_active = true
    LOOP
      -- Insert or update leave balance
      INSERT INTO leave_balances (
        employee_id, 
        leave_type, 
        year, 
        allocated_days,
        used_days,
        carried_over_days
      )
      VALUES (
        employee_record.id,
        allocation_record.leave_type,
        target_year,
        allocation_record.default_allocation,
        0,
        0
      )
      ON CONFLICT (employee_id, leave_type, year) 
      DO UPDATE SET
        allocated_days = allocation_record.default_allocation,
        updated_at = now()
      WHERE leave_balances.allocated_days != allocation_record.default_allocation;
      
      balance_count := balance_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN balance_count;
END;
$$;

-- Create function to get leave statistics
CREATE OR REPLACE FUNCTION public.get_leave_statistics()
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'pending_requests', (
      SELECT COUNT(*) FROM leave_requests WHERE status = 'pending'
    ),
    'approved_requests', (
      SELECT COUNT(*) FROM leave_requests WHERE status = 'approved'
    ),
    'total_requests', (
      SELECT COUNT(*) FROM leave_requests
    ),
    'total_days_requested', (
      SELECT COALESCE(SUM(days_requested), 0) FROM leave_requests WHERE status IN ('approved', 'pending')
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- Add trigger for updated_at on leave_allocations
CREATE TRIGGER update_leave_allocations_updated_at
  BEFORE UPDATE ON public.leave_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
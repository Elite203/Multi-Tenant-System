-- Create timesheets table
CREATE TABLE public.timesheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  week_starting DATE NOT NULL,
  monday_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  tuesday_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  wednesday_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  thursday_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  friday_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  saturday_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  sunday_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  total_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  regular_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  overtime_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, week_starting)
);

-- Enable Row Level Security
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- Create policies for timesheet access
CREATE POLICY "Admins and HR can manage all timesheets"
ON public.timesheets
FOR ALL
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "Users can view own timesheets"
ON public.timesheets
FOR SELECT
USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Users can create own timesheets"
ON public.timesheets
FOR INSERT
WITH CHECK (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Users can update own draft timesheets"
ON public.timesheets
FOR UPDATE
USING (employee_id = get_employee_id(auth.uid()) AND status = 'draft');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_timesheets_updated_at
BEFORE UPDATE ON public.timesheets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_timesheets_employee_week ON public.timesheets(employee_id, week_starting);
CREATE INDEX idx_timesheets_status ON public.timesheets(status);

-- Add check constraints
ALTER TABLE public.timesheets ADD CONSTRAINT chk_hours_valid 
CHECK (
  monday_hours >= 0 AND monday_hours <= 24 AND
  tuesday_hours >= 0 AND tuesday_hours <= 24 AND
  wednesday_hours >= 0 AND wednesday_hours <= 24 AND
  thursday_hours >= 0 AND thursday_hours <= 24 AND
  friday_hours >= 0 AND friday_hours <= 24 AND
  saturday_hours >= 0 AND saturday_hours <= 24 AND
  sunday_hours >= 0 AND sunday_hours <= 24 AND
  total_hours >= 0 AND
  regular_hours >= 0 AND
  overtime_hours >= 0
);

ALTER TABLE public.timesheets ADD CONSTRAINT chk_status_valid 
CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));
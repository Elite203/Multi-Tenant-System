export interface RotaShift {
  id: string;
  employee_id: string;
  shift_type_id: string;
  location_id: string;
  department_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  break_minutes?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RotaShiftType {
  id: string;
  name: string;
  description?: string;
  color: string;
  duration_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RotaLocation {
  id: string;
  name: string;
  address?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RotaStats {
  total_shifts: number;
  unique_employees: number;
  total_hours: number;
  confirmed_shifts: number;
}

export interface ShiftWithDetails extends RotaShift {
  employee_name: string;
  employee_avatar?: string;
  shift_type_name: string;
  shift_type_color: string;
  location_name: string;
  location_address?: string;
  department_name?: string;
}
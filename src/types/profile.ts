// Unified Profile Types
export interface UserProfile {
  // Core profile data
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  address?: string;
  bio?: string;
  role?: 'admin' | 'hr' | 'manager' | 'director' | 'employee';
  
  // Employee-specific data (optional for non-employees)
  employee_id?: string;
  employee_number?: string;
  department_name?: string;
  job_title_name?: string;
  start_date?: string;
  company_name?: string;
  hire_date?: string;
  salary?: number;
  employee_type?: string;
  status?: string;
  manager_name?: string;
  national_insurance_number?: string;
}

export interface LeaveBalance {
  id: string;
  leave_type: string;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
  year: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  email?: string;
  address?: string;
  is_primary: boolean;
  priority_order?: number;
}

export interface ProfileData {
  profile: UserProfile | null;
  leaveBalances: LeaveBalance[];
  emergencyContacts: EmergencyContact[];
  isEmployee: boolean;
}

export interface FormValidationError {
  field: string;
  message: string;
}
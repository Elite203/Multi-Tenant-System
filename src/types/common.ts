// Common type definitions for improved type safety

export interface ErrorInfo {
  message: string;
  details?: string;
  timestamp?: string;
}

export interface ApiError extends Error {
  details?: any;
  code?: string;
}

export interface ImportError {
  row: number;
  field: string;
  error: string;
  value: unknown;
}

export interface ImportWarning {
  row: number;
  field: string;
  error: string;
  value: unknown;
}

export interface EmployeeBankDetails {
  id: string;
  employee_id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  sort_code: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCertification {
  id: string;
  employee_id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeEducation {
  id: string;
  employee_id: string;
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date: string;
  end_date?: string;
  grade?: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeTraining {
  id: string;
  employee_id: string;
  name: string;
  provider: string;
  completion_date: string;
  expiry_date?: string;
  certificate_url?: string;
  score?: number;
  is_mandatory: boolean;
  status: 'not_started' | 'in_progress' | 'completed' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface WorkProfile {
  skills?: string[];
  languages?: LanguageSkill[];
  work_preferences?: WorkPreferences;
  availability?: Availability;
  performance_metrics?: PerformanceMetrics;
}

export interface LanguageSkill {
  language: string;
  proficiency: 'basic' | 'intermediate' | 'advanced' | 'native';
}

export interface WorkPreferences {
  preferred_schedule?: 'full_time' | 'part_time' | 'flexible';
  remote_work?: boolean;
  travel_willingness?: number;
  overtime_availability?: boolean;
}

export interface Availability {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface PerformanceMetrics {
  overall_rating?: number;
  last_review_date?: string;
  goals?: string[];
  achievements?: string[];
}

// Report and data types
export interface ReportData {
  headers: string[];
  rows: ReportRow[];
  metadata: ReportMetadata;
}

export interface ReportRow {
  [key: string]: string | number | boolean | null;
}

export interface ReportMetadata {
  total: number;
  generated: string;
  filters: Record<string, string | number | boolean>;
}

// Standard error type for consistency
export interface StandardError {
  message: string;
  code?: string;
  details?: unknown;
}
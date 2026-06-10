// Employee document type definitions

export interface PassportDocument {
  id: string;
  employee_id: string;
  passport_number: string;
  country: string;
  issue_date: string;
  expiry_date: string;
  issuing_authority?: string;
  document_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VisaDocument {
  id: string;
  employee_id: string;
  visa_type: string;
  visa_number: string;
  country: string;
  issue_date: string;
  expiry_date: string;
  sponsor?: string;
  document_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RTWDocument {
  id: string;
  employee_id: string;
  document_type: string;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  document_url?: string;
  verification_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface COSDocument {
  id: string;
  employee_id: string;
  cos_number: string;
  sponsor_name: string;
  job_title: string;
  start_date: string;
  end_date?: string;
  salary: number;
  document_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BankDetail {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  sort_code?: string;
  iban?: string;
  swift_code?: string;
  currency_code?: string;
  verification_status?: string;
  is_primary: boolean;
  is_active: boolean;
}

export interface CertificationRecord {
  id: string;
  employee_id: string;
  certification_name: string;
  issuing_organization: string;
  certification_number?: string;
  issue_date?: string;
  expiry_date?: string;
  is_active: boolean;
  requires_renewal: boolean;
  document_path?: string;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingRecord {
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

export interface EducationRecord {
  id: string;
  employee_id: string;
  institution_name: string;
  degree_type: string;
  field_of_study?: string;
  start_date: string;
  graduation_date?: string;
  grade_gpa?: string;
  is_completed: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  leave_type: string;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
  year: number;
}

// Document form interfaces
export interface DocumentFormData {
  [key: string]: string | number | boolean | Date | null | undefined;
}

export interface ImmigrationDocument {
  id: string;
  employee_id: string;
  document_type: string;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  document_url?: string;
  status?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Training and certification types for forms
export interface TrainingFormData {
  id?: string;
  employee_id: string;
  training_name: string;
  training_type: string;
  training_provider: string;
  completion_date: string;
  expiry_date?: string;
  certificate_url?: string;
  score?: number;
  is_mandatory: boolean;
  status: 'not_started' | 'in_progress' | 'completed' | 'expired';
  notes?: string;
  document_path?: string;
}

export interface CertificationFormData {
  id?: string;
  employee_id: string;
  certification_name: string;
  issuing_organization: string;
  certification_number?: string;
  issue_date?: string;
  expiry_date?: string;
  is_active: boolean;
  requires_renewal: boolean;
  document_path?: string;
}

export interface EducationFormData {
  id?: string;
  employee_id: string;
  institution_name: string;
  degree_type: string;
  field_of_study?: string;
  start_date: string;
  graduation_date?: string;
  grade_gpa?: string;
  is_completed: boolean;
}
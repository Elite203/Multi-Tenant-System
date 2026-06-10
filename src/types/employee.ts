// Standardized Employee Types for Production Use

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated' | 'archived';
export type EmployeeType = 'staff' | 'manager' | 'director' | 'owner' | 'executive';
export type ImmigrationStatus = 'approved' | 'pending_review' | 'requires_renewal' | 'expired' | 'rejected';

export interface BaseEmployee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  national_insurance_number: string;
  street_address: string | null;
  address_line_2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  hire_date: string;
  start_date: string | null;
  status: EmployeeStatus;
  employee_type: EmployeeType;
  salary: number | null;
  profile_photo: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  archived_by: string | null;
  
  // Foreign keys
  user_id: string | null;
  company_id: string;
  manager_id: string | null;
  department: string | null;
  job_title: string | null;
  current_nationality_id: string | null;
  sponsored_by_company_id: string | null;
  
  // Computed fields
  compliance_score: number;
  immigration_status: ImmigrationStatus;
  leave_entitlement: number;
  remaining_leaves: number;
  weekly_working_hours: number | null;
}

export interface EmployeeWithRelations extends BaseEmployee {
  company: {
    id: string;
    name: string;
  } | null;
  manager: {
    id: string;
    first_name: string;
    last_name: string;
    employee_number: string;
  } | null;
  department_info: {
    id: string;
    name: string;
  } | null;
  job_title_info: {
    id: string;
    title: string;
  } | null;
  current_nationality: {
    id: string;
    name: string;
  } | null;
  sponsored_by_company: {
    id: string;
    name: string;
  } | null;
}

// Legacy support - maps to current database structure
export interface Employee extends Omit<BaseEmployee, 'department' | 'job_title'> {
  // For backward compatibility
  position?: string;
  job_title_name?: string | null;
  department: string | null;
  department_name?: string | null;
  current_nationality_name?: string | null;
  sponsored_by_company_name?: string | null;
  company: {
    id: string;
    name: string;
  } | null;
}

// Form data types
export interface EmployeeFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: Date;
  national_insurance_number: string;
  street_address?: string;
  address_line_2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  hire_date: Date;
  start_date?: Date;
  status: EmployeeStatus;
  employee_type: EmployeeType;
  salary?: number;
  company_id: string;
  manager_id?: string;
  department?: string;
  job_title?: string;
  current_nationality_id?: string;
  sponsored_by_company_id?: string;
}

// API Response types
export interface EmployeeListResponse {
  data: Employee[];
  count: number;
  page: number;
  pageSize: number;
}

export interface EmployeeDetailResponse extends EmployeeWithRelations {
  // Additional related data
  passports: EmployeePassport[];
  visas: EmployeeVisa[];
  rtw_documents: EmployeeRTWDocument[];
  cos_documents: EmployeeCOSDocument[];
  bank_details: EmployeeBankDetails[];
  certifications: EmployeeCertification[];
  training: EmployeeTraining[];
  education: EmployeeEducation[];
  emergency_contacts: EmergencyContact[];
  leave_balances: LeaveBalance[];
  work_profile: EmployeeWorkProfile | null;
}

// Related entity types
export interface EmployeePassport {
  id: string;
  passport_number: string;
  issuing_country: string;
  nationality: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  is_current: boolean;
  document_path: string | null;
}

export interface EmployeeVisa {
  id: string;
  visa_number: string;
  visa_type: string;
  issuing_country: string;
  issue_date: string;
  expiry_date: string;
  is_current: boolean;
  conditions: string | null;
  document_path: string | null;
}

export interface EmployeeRTWDocument {
  id: string;
  rtw_reference: string;
  rtw_status: string;
  share_code: string | null;
  checked_date: string | null;
  expiry_date: string | null;
  is_current_active: boolean;
  status: string;
  document_path: string | null;
  notes: string | null;
}

export interface EmployeeCOSDocument {
  id: string;
  cos_reference_number: string;
  certificate_number: string | null;
  license_number: string | null;
  assigned_date: string | null;
  certified_date: string | null;
  cos_status: string;
  sponsor_note: string | null;
  document_path: string | null;
  notes: string | null;
}

export interface EmployeeBankDetails {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  sort_code: string | null;
  iban: string | null;
  swift_code: string | null;
  currency_code: string;
  verification_status: string;
  is_primary: boolean;
  is_active: boolean;
}

export interface EmployeeCertification {
  id: string;
  certification_name: string;
  issuing_organization: string;
  certification_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  is_active: boolean;
  requires_renewal: boolean;
  document_path: string | null;
}

export interface EmployeeTraining {
  id: string;
  training_name: string;
  training_provider: string | null;
  training_type: string | null;
  completion_date: string | null;
  expiry_date: string | null;
  score: number | null;
  status: string;
  is_mandatory: boolean;
  document_path: string | null;
  notes: string | null;
}

export interface EmployeeEducation {
  id: string;
  institution_name: string;
  degree_type: string | null;
  field_of_study: string | null;
  grade_gpa: string | null;
  start_date: string | null;
  graduation_date: string | null;
  is_completed: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  address: string | null;
  is_primary: boolean;
  priority_order: number;
}

export interface LeaveBalance {
  id: string;
  leave_type: string;
  allocated_days: number;
  used_days: number;
  carried_over_days: number;
  year: number;
}

export interface EmployeeWorkProfile {
  id: string;
  soc_number: string | null;
  work_email: string | null;
  work_phone: string | null;
  work_location: string | null;
  weekly_working_hours: number | null;
  sponsored_by_company_id: string | null;
  start_date: string | null;
  end_date: string | null;
  career_goals: string | null;
  remote_work_preference: string | null;
  travel_willingness: string | null;
  skills: Record<string, any> | null;
  languages: Record<string, any> | null;
  work_preferences: Record<string, any> | null;
  availability: Record<string, any> | null;
  performance_metrics: Record<string, any> | null;
}

// Utility types for filtering and sorting
export interface EmployeeFilters {
  search?: string;
  status?: EmployeeStatus | 'all';
  department?: string | 'all';
  employee_type?: EmployeeType | 'all';
  manager_id?: string;
  company_id?: string;
  immigration_status?: ImmigrationStatus | 'all';
  show_archived?: boolean;
}

export interface EmployeeSortOptions {
  field: keyof Employee;
  direction: 'asc' | 'desc';
}

// Pagination
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

// Analytics types
export interface EmployeeAnalytics {
  total_employees: number;
  active_employees: number;
  departments_count: number;
  average_salary: number | null;
  turnover_rate: number;
  compliance_score_avg: number;
  immigration_status_breakdown: Record<ImmigrationStatus, number>;
  department_breakdown: Array<{
    department: string;
    count: number;
    percentage: number;
  }>;
  employee_type_breakdown: Record<EmployeeType, number>;
  recent_hires: Employee[];
}
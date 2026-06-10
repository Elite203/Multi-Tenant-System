export interface ImportTemplate {
  id: string;
  module_name: string;
  display_name: string;
  description: string;
  required_fields: string[];
  optional_fields: string[];
  field_mappings: any; // JSONB from database
  validation_rules: any; // JSONB from database  
  sample_data: any; // JSONB from database
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ValidationError {
  row: number;
  field: string;
  error: string;
  value: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ImportJob {
  id: string;
  user_id: string;
  template_id: string;
  filename: string;
  file_size: number;
  total_rows: number;
  processed_rows: number;
  success_rows: number;
  error_rows: number;
  warning_rows: number;
  status: 'pending' | 'validating' | 'validated' | 'validation_failed' | 'importing' | 'completed' | 'failed';
  progress: number;
  started_at?: string;
  completed_at?: string;
  error_summary?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ImportResult {
  success: boolean;
  jobId: string;
  message?: string;
  totalRows?: number;
  successRows?: number;
  errorRows?: number;
  warningRows?: number;
  status?: 'success' | 'partial' | 'failed';
}

export interface ImportStats {
  availableModules: number;
  templatesReady: number;
  importStatus: string;
  dataQuality: number;
}
// Work profile and skills type definitions

export interface WorkProfileSkills {
  [skillName: string]: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface WorkProfileLanguages {
  [languageName: string]: 'basic' | 'intermediate' | 'advanced' | 'native';
}

export interface WorkPreferences {
  preferred_schedule?: 'full_time' | 'part_time' | 'flexible';
  remote_work?: boolean;
  travel_willingness?: number;
  overtime_availability?: boolean;
  preferred_location?: string;
  shift_preference?: string;
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
  kpis?: { [kpiName: string]: number };
  feedback_summary?: string;
}

export interface EmployeeWorkProfile {
  id: string;
  employee_id: string;
  soc_number?: string | null;
  work_email?: string | null;
  work_phone?: string | null;
  work_location?: string | null;
  weekly_working_hours?: number | null;
  sponsored_by_company_id?: string | null;
  sponsored_by_company_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  skills?: WorkProfileSkills;
  languages?: WorkProfileLanguages;
  work_preferences?: WorkPreferences;
  career_goals?: string | null;
  remote_work_preference?: string | null;
  travel_willingness?: string | null;
  availability?: Availability;
  performance_metrics?: PerformanceMetrics;
  created_at: string;
  updated_at: string;
}
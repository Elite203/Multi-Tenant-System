export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          priority: string
          start_date: string | null
          status: string
          target_roles: string[]
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          priority?: string
          start_date?: string | null
          status?: string
          target_roles?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          priority?: string
          start_date?: string | null
          status?: string
          target_roles?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branding_settings: {
        Row: {
          application_name: string
          company_name: string
          created_at: string
          currency: string
          favicon_url: string | null
          fiscal_year_start_date: string
          id: string
          language: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          timezone: string
          updated_at: string
        }
        Insert: {
          application_name?: string
          company_name?: string
          created_at?: string
          currency?: string
          favicon_url?: string | null
          fiscal_year_start_date?: string
          id?: string
          language?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          application_name?: string
          company_name?: string
          created_at?: string
          currency?: string
          favicon_url?: string | null
          fiscal_year_start_date?: string
          id?: string
          language?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          company_code: string | null
          country_id: string | null
          created_at: string | null
          description: string | null
          director: string | null
          email: string | null
          employee_count: number | null
          has_sponsor_license: boolean
          holding_company_id: string | null
          id: string
          is_active: boolean | null
          logo: string | null
          name: string
          owner: string | null
          parent_company_id: string | null
          phone: string | null
          postal_code: string | null
          registration_number: string | null
          state_province: string | null
          status: string | null
          street_address: string | null
          tax_number: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_code?: string | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          director?: string | null
          email?: string | null
          employee_count?: number | null
          has_sponsor_license?: boolean
          holding_company_id?: string | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name: string
          owner?: string | null
          parent_company_id?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_number?: string | null
          state_province?: string | null
          status?: string | null
          street_address?: string | null
          tax_number?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_code?: string | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          director?: string | null
          email?: string | null
          employee_count?: number | null
          has_sponsor_license?: boolean
          holding_company_id?: string | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name?: string
          owner?: string | null
          parent_company_id?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_number?: string | null
          state_province?: string | null
          status?: string | null
          street_address?: string | null
          tax_number?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_companies_country"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_companies_holding_company"
            columns: ["holding_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_attachments: {
        Row: {
          category: string
          company_id: string
          content_type: string | null
          created_at: string
          file_path: string
          file_size: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category: string
          company_id: string
          content_type?: string | null
          created_at?: string
          file_path: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          company_id?: string
          content_type?: string | null
          created_at?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string
          currency_code: string | null
          id: string
          is_active: boolean
          is_eu: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency_code?: string | null
          id?: string
          is_active?: boolean
          is_eu?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency_code?: string | null
          id?: string
          is_active?: boolean
          is_eu?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_department_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_department_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_department_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_processed: boolean | null
          category: Database["public"]["Enums"]["document_category"]
          company_id: string | null
          company_type: string | null
          content_type: string | null
          created_at: string | null
          document_category: string | null
          document_hash: string | null
          employee_id: string | null
          expiry_date: string | null
          extraction_method: string | null
          file_path: string
          file_size: number | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          profile_id: string | null
          size_mb: number | null
          status: string | null
          type_confidence: number | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          ai_processed?: boolean | null
          category: Database["public"]["Enums"]["document_category"]
          company_id?: string | null
          company_type?: string | null
          content_type?: string | null
          created_at?: string | null
          document_category?: string | null
          document_hash?: string | null
          employee_id?: string | null
          expiry_date?: string | null
          extraction_method?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          profile_id?: string | null
          size_mb?: number | null
          status?: string | null
          type_confidence?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          ai_processed?: boolean | null
          category?: Database["public"]["Enums"]["document_category"]
          company_id?: string | null
          company_type?: string | null
          content_type?: string | null
          created_at?: string | null
          document_category?: string | null
          document_hash?: string | null
          employee_id?: string | null
          expiry_date?: string | null
          extraction_method?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          profile_id?: string | null
          size_mb?: number | null
          status?: string | null
          type_confidence?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          notification_id: string | null
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_id?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_id?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          employee_id: string
          id: string
          is_primary: boolean | null
          name: string
          phone: string
          priority_order: number | null
          relationship: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          employee_id: string
          id?: string
          is_primary?: boolean | null
          name: string
          phone: string
          priority_order?: number | null
          relationship: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          employee_id?: string
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string
          priority_order?: number | null
          relationship?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_bank_details: {
        Row: {
          account_holder_name: string
          account_number: string
          archived_at: string | null
          archived_by: string | null
          bank_address: string | null
          bank_name: string
          created_at: string
          currency_code: string | null
          employee_id: string
          iban: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          sort_code: string | null
          swift_code: string | null
          updated_at: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_holder_name: string
          account_number: string
          archived_at?: string | null
          archived_by?: string | null
          bank_address?: string | null
          bank_name: string
          created_at?: string
          currency_code?: string | null
          employee_id: string
          iban?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          sort_code?: string | null
          swift_code?: string | null
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          archived_at?: string | null
          archived_by?: string | null
          bank_address?: string | null
          bank_name?: string
          created_at?: string
          currency_code?: string | null
          employee_id?: string
          iban?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          sort_code?: string | null
          swift_code?: string | null
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      employee_certifications: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          certification_name: string
          certification_number: string | null
          created_at: string
          document_path: string | null
          employee_id: string
          expiry_date: string | null
          id: string
          is_active: boolean | null
          issue_date: string | null
          issuing_organization: string
          requires_renewal: boolean | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          certification_name: string
          certification_number?: string | null
          created_at?: string
          document_path?: string | null
          employee_id: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuing_organization: string
          requires_renewal?: boolean | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          certification_name?: string
          certification_number?: string | null
          created_at?: string
          document_path?: string | null
          employee_id?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuing_organization?: string
          requires_renewal?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_cos_documents: {
        Row: {
          assigned_date: string | null
          certificate_number: string | null
          certified_date: string | null
          cos_reference_number: string
          cos_status: Database["public"]["Enums"]["cos_status_enum"] | null
          created_at: string
          document_path: string | null
          employee_id: string
          id: string
          license_number: string | null
          notes: string | null
          sponsor_name: string | null
          sponsor_note: string | null
          updated_at: string
        }
        Insert: {
          assigned_date?: string | null
          certificate_number?: string | null
          certified_date?: string | null
          cos_reference_number: string
          cos_status?: Database["public"]["Enums"]["cos_status_enum"] | null
          created_at?: string
          document_path?: string | null
          employee_id: string
          id?: string
          license_number?: string | null
          notes?: string | null
          sponsor_name?: string | null
          sponsor_note?: string | null
          updated_at?: string
        }
        Update: {
          assigned_date?: string | null
          certificate_number?: string | null
          certified_date?: string | null
          cos_reference_number?: string
          cos_status?: Database["public"]["Enums"]["cos_status_enum"] | null
          created_at?: string
          document_path?: string | null
          employee_id?: string
          id?: string
          license_number?: string | null
          notes?: string | null
          sponsor_name?: string | null
          sponsor_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_cos_documents_sponsor_name_fkey"
            columns: ["sponsor_name"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_education: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          degree_type: string | null
          employee_id: string
          field_of_study: string | null
          grade_gpa: string | null
          graduation_date: string | null
          id: string
          institution_name: string
          is_completed: boolean | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          degree_type?: string | null
          employee_id: string
          field_of_study?: string | null
          grade_gpa?: string | null
          graduation_date?: string | null
          id?: string
          institution_name: string
          is_completed?: boolean | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          degree_type?: string | null
          employee_id?: string
          field_of_study?: string | null
          grade_gpa?: string | null
          graduation_date?: string | null
          id?: string
          institution_name?: string
          is_completed?: boolean | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_job_history: {
        Row: {
          approved_by: string | null
          created_at: string
          department: string | null
          employee_id: string
          end_date: string | null
          id: string
          job_title: string | null
          reason_for_change: string | null
          salary: number | null
          start_date: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          department?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          job_title?: string | null
          reason_for_change?: string | null
          salary?: number | null
          start_date: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          department?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          job_title?: string | null
          reason_for_change?: string | null
          salary?: number | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_job_history_department_id_fkey"
            columns: ["department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_job_history_job_title_id_fkey"
            columns: ["job_title"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_passports: {
        Row: {
          created_at: string
          document_path: string | null
          employee_id: string
          expiry_date: string
          id: string
          is_current: boolean | null
          issue_date: string | null
          issuing_authority: string | null
          issuing_country_id: string
          nationality_id: string | null
          passport_number: string
          place_of_birth: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_path?: string | null
          employee_id: string
          expiry_date: string
          id?: string
          is_current?: boolean | null
          issue_date?: string | null
          issuing_authority?: string | null
          issuing_country_id: string
          nationality_id?: string | null
          passport_number: string
          place_of_birth?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_path?: string | null
          employee_id?: string
          expiry_date?: string
          id?: string
          is_current?: boolean | null
          issue_date?: string | null
          issuing_authority?: string | null
          issuing_country_id?: string
          nationality_id?: string | null
          passport_number?: string
          place_of_birth?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_employee_passports_issuing_country"
            columns: ["issuing_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employee_passports_nationality"
            columns: ["nationality_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_rtw_documents: {
        Row: {
          checked_by: string | null
          checked_date: string | null
          created_at: string
          document_number: string | null
          document_path: string | null
          employee_id: string
          expiry_date: string | null
          id: string
          is_current_active: boolean | null
          is_valid: boolean | null
          issue_date: string | null
          notes: string | null
          rtw_reference: string | null
          rtw_status: string | null
          share_code: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          checked_by?: string | null
          checked_date?: string | null
          created_at?: string
          document_number?: string | null
          document_path?: string | null
          employee_id: string
          expiry_date?: string | null
          id?: string
          is_current_active?: boolean | null
          is_valid?: boolean | null
          issue_date?: string | null
          notes?: string | null
          rtw_reference?: string | null
          rtw_status?: string | null
          share_code?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          checked_by?: string | null
          checked_date?: string | null
          created_at?: string
          document_number?: string | null
          document_path?: string | null
          employee_id?: string
          expiry_date?: string | null
          id?: string
          is_current_active?: boolean | null
          is_valid?: boolean | null
          issue_date?: string | null
          notes?: string | null
          rtw_reference?: string | null
          rtw_status?: string | null
          share_code?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_training: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          completion_date: string | null
          created_at: string
          document_path: string | null
          employee_id: string
          expiry_date: string | null
          id: string
          is_mandatory: boolean | null
          notes: string | null
          score: number | null
          status: string | null
          training_name: string
          training_provider: string | null
          training_type: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          completion_date?: string | null
          created_at?: string
          document_path?: string | null
          employee_id: string
          expiry_date?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          score?: number | null
          status?: string | null
          training_name: string
          training_provider?: string | null
          training_type?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          completion_date?: string | null
          created_at?: string
          document_path?: string | null
          employee_id?: string
          expiry_date?: string | null
          id?: string
          is_mandatory?: boolean | null
          notes?: string | null
          score?: number | null
          status?: string | null
          training_name?: string
          training_provider?: string | null
          training_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_manager: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_manager?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_manager?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_visas: {
        Row: {
          conditions: string | null
          created_at: string
          document_path: string | null
          employee_id: string
          expiry_date: string | null
          id: string
          is_current: boolean | null
          issue_date: string | null
          issuing_country_id: string
          updated_at: string
          valid_for_countries: string[] | null
          visa_number: string | null
          visa_type_id: string | null
        }
        Insert: {
          conditions?: string | null
          created_at?: string
          document_path?: string | null
          employee_id: string
          expiry_date?: string | null
          id?: string
          is_current?: boolean | null
          issue_date?: string | null
          issuing_country_id: string
          updated_at?: string
          valid_for_countries?: string[] | null
          visa_number?: string | null
          visa_type_id?: string | null
        }
        Update: {
          conditions?: string | null
          created_at?: string
          document_path?: string | null
          employee_id?: string
          expiry_date?: string | null
          id?: string
          is_current?: boolean | null
          issue_date?: string | null
          issuing_country_id?: string
          updated_at?: string
          valid_for_countries?: string[] | null
          visa_number?: string | null
          visa_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_visas_issuing_country_id_fkey"
            columns: ["issuing_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_visas_visa_type_id_fkey"
            columns: ["visa_type_id"]
            isOneToOne: false
            referencedRelation: "visa_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employee_visas_issuing_country"
            columns: ["issuing_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_work_profiles: {
        Row: {
          availability: Json | null
          career_goals: string | null
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          languages: Json | null
          performance_metrics: Json | null
          remote_work_preference: string | null
          skills: Json | null
          soc_number: string | null
          sponsored_by_company_id: string | null
          start_date: string | null
          travel_willingness: string | null
          updated_at: string
          weekly_working_hours: number | null
          work_email: string | null
          work_location: string | null
          work_phone: string | null
          work_preferences: Json | null
        }
        Insert: {
          availability?: Json | null
          career_goals?: string | null
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          languages?: Json | null
          performance_metrics?: Json | null
          remote_work_preference?: string | null
          skills?: Json | null
          soc_number?: string | null
          sponsored_by_company_id?: string | null
          start_date?: string | null
          travel_willingness?: string | null
          updated_at?: string
          weekly_working_hours?: number | null
          work_email?: string | null
          work_location?: string | null
          work_phone?: string | null
          work_preferences?: Json | null
        }
        Update: {
          availability?: Json | null
          career_goals?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          languages?: Json | null
          performance_metrics?: Json | null
          remote_work_preference?: string | null
          skills?: Json | null
          soc_number?: string | null
          sponsored_by_company_id?: string | null
          start_date?: string | null
          travel_willingness?: string | null
          updated_at?: string
          weekly_working_hours?: number | null
          work_email?: string | null
          work_location?: string | null
          work_phone?: string | null
          work_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_work_profiles_sponsored_by_company_id_fkey"
            columns: ["sponsored_by_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address_line_2: string | null
          archived_at: string | null
          archived_by: string | null
          city: string | null
          company_id: string
          compliance_score: number | null
          country_id: string | null
          created_at: string | null
          current_nationality_id: string | null
          date_of_birth: string | null
          department: string | null
          email: string | null
          employee_number: string
          employee_type: Database["public"]["Enums"]["employee_type"] | null
          first_name: string
          hire_date: string
          id: string
          immigration_status:
            | Database["public"]["Enums"]["immigration_status_enum"]
            | null
          job_title: string | null
          last_name: string
          leave_entitlement: number | null
          manager_id: string | null
          national_insurance_number: string
          phone: string | null
          postal_code: string | null
          profile_photo: string | null
          remaining_leaves: number | null
          salary: number | null
          sponsored_by_company_id: string | null
          start_date: string | null
          state_province: string | null
          status: Database["public"]["Enums"]["employee_status"] | null
          street_address: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_line_2?: string | null
          archived_at?: string | null
          archived_by?: string | null
          city?: string | null
          company_id: string
          compliance_score?: number | null
          country_id?: string | null
          created_at?: string | null
          current_nationality_id?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          employee_number?: string
          employee_type?: Database["public"]["Enums"]["employee_type"] | null
          first_name: string
          hire_date: string
          id?: string
          immigration_status?:
            | Database["public"]["Enums"]["immigration_status_enum"]
            | null
          job_title?: string | null
          last_name: string
          leave_entitlement?: number | null
          manager_id?: string | null
          national_insurance_number: string
          phone?: string | null
          postal_code?: string | null
          profile_photo?: string | null
          remaining_leaves?: number | null
          salary?: number | null
          sponsored_by_company_id?: string | null
          start_date?: string | null
          state_province?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          street_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_line_2?: string | null
          archived_at?: string | null
          archived_by?: string | null
          city?: string | null
          company_id?: string
          compliance_score?: number | null
          country_id?: string | null
          created_at?: string | null
          current_nationality_id?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          employee_number?: string
          employee_type?: Database["public"]["Enums"]["employee_type"] | null
          first_name?: string
          hire_date?: string
          id?: string
          immigration_status?:
            | Database["public"]["Enums"]["immigration_status_enum"]
            | null
          job_title?: string | null
          last_name?: string
          leave_entitlement?: number | null
          manager_id?: string | null
          national_insurance_number?: string
          phone?: string | null
          postal_code?: string | null
          profile_photo?: string | null
          remaining_leaves?: number | null
          salary?: number | null
          sponsored_by_company_id?: string | null
          start_date?: string | null
          state_province?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          street_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_current_nationality_id_fkey"
            columns: ["current_nationality_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_job_title_id_fkey"
            columns: ["job_title"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_current_nationality"
            columns: ["current_nationality_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_department"
            columns: ["department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_job_title"
            columns: ["job_title"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_sponsored_by_company"
            columns: ["sponsored_by_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      immigration_documents: {
        Row: {
          conditions: string | null
          created_at: string
          document_status: Database["public"]["Enums"]["document_status"] | null
          document_type: string
          employee_id: string
          expiry_date: string | null
          file_path: string | null
          id: string
          issue_date: string | null
          issuing_authority: string | null
          notes: string | null
          reference_number: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sponsor_licence_number: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          conditions?: string | null
          created_at?: string
          document_status?:
            | Database["public"]["Enums"]["document_status"]
            | null
          document_type: string
          employee_id: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          reference_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sponsor_licence_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          conditions?: string | null
          created_at?: string
          document_status?:
            | Database["public"]["Enums"]["document_status"]
            | null
          document_type?: string
          employee_id?: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          reference_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sponsor_licence_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      import_errors: {
        Row: {
          created_at: string
          error_message: string
          error_type: string
          field_name: string | null
          id: string
          job_id: string
          raw_value: string | null
          row_number: number
        }
        Insert: {
          created_at?: string
          error_message: string
          error_type: string
          field_name?: string | null
          id?: string
          job_id: string
          raw_value?: string | null
          row_number: number
        }
        Update: {
          created_at?: string
          error_message?: string
          error_type?: string
          field_name?: string | null
          id?: string
          job_id?: string
          raw_value?: string | null
          row_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_errors_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_rows: number
          error_summary: Json | null
          file_size: number
          filename: string
          id: string
          processed_rows: number
          progress: number
          started_at: string | null
          status: string
          success_rows: number
          template_id: string
          total_rows: number
          updated_at: string
          user_id: string
          warning_rows: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_rows?: number
          error_summary?: Json | null
          file_size: number
          filename: string
          id?: string
          processed_rows?: number
          progress?: number
          started_at?: string | null
          status?: string
          success_rows?: number
          template_id: string
          total_rows?: number
          updated_at?: string
          user_id: string
          warning_rows?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_rows?: number
          error_summary?: Json | null
          file_size?: number
          filename?: string
          id?: string
          processed_rows?: number
          progress?: number
          started_at?: string | null
          status?: string
          success_rows?: number
          template_id?: string
          total_rows?: number
          updated_at?: string
          user_id?: string
          warning_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "import_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      import_previews: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          job_id: string
          preview_data: Json
          validation_results: Json
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          job_id: string
          preview_data?: Json
          validation_results?: Json
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          job_id?: string
          preview_data?: Json
          validation_results?: Json
        }
        Relationships: [
          {
            foreignKeyName: "import_previews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_templates: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          field_mappings: Json
          id: string
          is_active: boolean
          module_name: string
          optional_fields: string[]
          required_fields: string[]
          sample_data: Json
          updated_at: string
          validation_rules: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          field_mappings?: Json
          id?: string
          is_active?: boolean
          module_name: string
          optional_fields?: string[]
          required_fields?: string[]
          sample_data?: Json
          updated_at?: string
          validation_rules?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          field_mappings?: Json
          id?: string
          is_active?: boolean
          module_name?: string
          optional_fields?: string[]
          required_fields?: string[]
          sample_data?: Json
          updated_at?: string
          validation_rules?: Json
        }
        Relationships: []
      }
      job_titles: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          is_active: boolean
          level: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          level?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          level?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_titles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_allocations: {
        Row: {
          created_at: string
          default_allocation: number
          fiscal_year_start: string
          id: string
          is_active: boolean
          leave_type: Database["public"]["Enums"]["leave_type_enum"]
          max_carry_forward: number
          requires_approval: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_allocation?: number
          fiscal_year_start?: string
          id?: string
          is_active?: boolean
          leave_type: Database["public"]["Enums"]["leave_type_enum"]
          max_carry_forward?: number
          requires_approval?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_allocation?: number
          fiscal_year_start?: string
          id?: string
          is_active?: boolean
          leave_type?: Database["public"]["Enums"]["leave_type_enum"]
          max_carry_forward?: number
          requires_approval?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      leave_balances: {
        Row: {
          allocated_days: number | null
          carried_over_days: number | null
          created_at: string | null
          employee_id: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          updated_at: string | null
          used_days: number | null
          year: number
        }
        Insert: {
          allocated_days?: number | null
          carried_over_days?: number | null
          created_at?: string | null
          employee_id: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          updated_at?: string | null
          used_days?: number | null
          year: number
        }
        Update: {
          allocated_days?: number | null
          carried_over_days?: number | null
          created_at?: string | null
          employee_id?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          updated_at?: string | null
          used_days?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          days_requested: number
          employee_id: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"] | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days_requested: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days_requested?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          admin_email: string | null
          cc_emails: string[] | null
          created_at: string
          development_email_override: string | null
          development_mode: boolean | null
          document_expiry_days: number | null
          document_expiry_notifications: boolean | null
          email_notifications_enabled: boolean | null
          email_types: Json | null
          id: string
          in_app_enabled: boolean | null
          leave_status_notifications: boolean | null
          payslip_notifications: boolean | null
          reminder_days: number[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_email?: string | null
          cc_emails?: string[] | null
          created_at?: string
          development_email_override?: string | null
          development_mode?: boolean | null
          document_expiry_days?: number | null
          document_expiry_notifications?: boolean | null
          email_notifications_enabled?: boolean | null
          email_types?: Json | null
          id?: string
          in_app_enabled?: boolean | null
          leave_status_notifications?: boolean | null
          payslip_notifications?: boolean | null
          reminder_days?: number[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_email?: string | null
          cc_emails?: string[] | null
          created_at?: string
          development_email_override?: string | null
          development_mode?: boolean | null
          document_expiry_days?: number | null
          document_expiry_notifications?: boolean | null
          email_notifications_enabled?: boolean | null
          email_types?: Json | null
          id?: string
          in_app_enabled?: boolean | null
          leave_status_notifications?: boolean | null
          payslip_notifications?: boolean | null
          reminder_days?: number[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["notification_priority"] | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payslips: {
        Row: {
          attachment_path: string | null
          created_at: string
          employee_id: string
          extracted_data: Json | null
          extraction_confidence: number | null
          file_url: string | null
          gross_pay: number | null
          id: string
          month: number
          net_pay: number | null
          ni: number | null
          notes: string | null
          other_deductions: number | null
          pay_date: string | null
          pay_frequency: string | null
          pension: number | null
          period: string | null
          profile_id: string | null
          status: string | null
          tax: number | null
          updated_at: string
          year: number
        }
        Insert: {
          attachment_path?: string | null
          created_at?: string
          employee_id: string
          extracted_data?: Json | null
          extraction_confidence?: number | null
          file_url?: string | null
          gross_pay?: number | null
          id?: string
          month: number
          net_pay?: number | null
          ni?: number | null
          notes?: string | null
          other_deductions?: number | null
          pay_date?: string | null
          pay_frequency?: string | null
          pension?: number | null
          period?: string | null
          profile_id?: string | null
          status?: string | null
          tax?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          attachment_path?: string | null
          created_at?: string
          employee_id?: string
          extracted_data?: Json | null
          extraction_confidence?: number | null
          file_url?: string | null
          gross_pay?: number | null
          id?: string
          month?: number
          net_pay?: number | null
          ni?: number | null
          notes?: string | null
          other_deductions?: number | null
          pay_date?: string | null
          pay_frequency?: string | null
          pension?: number | null
          period?: string | null
          profile_id?: string | null
          status?: string | null
          tax?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          first_name: string | null
          force_password_change: boolean | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          force_password_change?: boolean | null
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          force_password_change?: boolean | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rota_locations: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rota_shift_types: {
        Row: {
          color: string
          created_at: string
          description: string | null
          duration_hours: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rota_shifts: {
        Row: {
          break_minutes: number | null
          created_at: string
          created_by: string | null
          date: string
          department_id: string | null
          employee_id: string
          end_time: string
          id: string
          location_id: string
          notes: string | null
          shift_type_id: string
          start_time: string
          status: Database["public"]["Enums"]["shift_status_enum"]
          updated_at: string
        }
        Insert: {
          break_minutes?: number | null
          created_at?: string
          created_by?: string | null
          date: string
          department_id?: string | null
          employee_id: string
          end_time: string
          id?: string
          location_id: string
          notes?: string | null
          shift_type_id: string
          start_time: string
          status?: Database["public"]["Enums"]["shift_status_enum"]
          updated_at?: string
        }
        Update: {
          break_minutes?: number | null
          created_at?: string
          created_by?: string | null
          date?: string
          department_id?: string | null
          employee_id?: string
          end_time?: string
          id?: string
          location_id?: string
          notes?: string | null
          shift_type_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["shift_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rota_shifts_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_shifts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "rota_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_shifts_shift_type_id_fkey"
            columns: ["shift_type_id"]
            isOneToOne: false
            referencedRelation: "rota_shift_types"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_jobs: {
        Row: {
          created_at: string
          cron_expression: string
          description: string | null
          error_count: number
          function_name: string
          id: string
          is_active: boolean
          last_error: string | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          success_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          cron_expression: string
          description?: string | null
          error_count?: number
          function_name: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          success_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          cron_expression?: string
          description?: string | null
          error_count?: number
          function_name?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          success_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          created_at: string
          enable_two_factor: boolean
          id: string
          lockout_duration_minutes: number
          max_login_attempts: number
          password_min_length: number
          password_require_lowercase: boolean
          password_require_numbers: boolean
          password_require_special_chars: boolean
          password_require_uppercase: boolean
          session_timeout_minutes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          enable_two_factor?: boolean
          id?: string
          lockout_duration_minutes?: number
          max_login_attempts?: number
          password_min_length?: number
          password_require_lowercase?: boolean
          password_require_numbers?: boolean
          password_require_special_chars?: boolean
          password_require_uppercase?: boolean
          session_timeout_minutes?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          enable_two_factor?: boolean
          id?: string
          lockout_duration_minutes?: number
          max_login_attempts?: number
          password_min_length?: number
          password_require_lowercase?: boolean
          password_require_numbers?: boolean
          password_require_special_chars?: boolean
          password_require_uppercase?: boolean
          session_timeout_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      timesheet_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          break_minutes: number | null
          created_at: string
          date: string
          description: string
          employee_id: string
          end_time: string | null
          hours: number
          id: string
          manager_id: string | null
          notes: string | null
          overtime_hours: number | null
          profile_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          shift_id: string | null
          start_time: string | null
          status: string | null
          updated_at: string
          week_ending: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number | null
          created_at?: string
          date: string
          description: string
          employee_id: string
          end_time?: string | null
          hours: number
          id?: string
          manager_id?: string | null
          notes?: string | null
          overtime_hours?: number | null
          profile_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          shift_id?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string
          week_ending?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          break_minutes?: number | null
          created_at?: string
          date?: string
          description?: string
          employee_id?: string
          end_time?: string | null
          hours?: number
          id?: string
          manager_id?: string | null
          notes?: string | null
          overtime_hours?: number | null
          profile_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          shift_id?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string
          week_ending?: string | null
        }
        Relationships: []
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          friday_hours: number
          id: string
          monday_hours: number
          notes: string | null
          overtime_hours: number
          regular_hours: number
          saturday_hours: number
          status: string
          submitted_at: string | null
          sunday_hours: number
          thursday_hours: number
          total_hours: number
          tuesday_hours: number
          updated_at: string
          wednesday_hours: number
          week_starting: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          friday_hours?: number
          id?: string
          monday_hours?: number
          notes?: string | null
          overtime_hours?: number
          regular_hours?: number
          saturday_hours?: number
          status?: string
          submitted_at?: string | null
          sunday_hours?: number
          thursday_hours?: number
          total_hours?: number
          tuesday_hours?: number
          updated_at?: string
          wednesday_hours?: number
          week_starting: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          friday_hours?: number
          id?: string
          monday_hours?: number
          notes?: string | null
          overtime_hours?: number
          regular_hours?: number
          saturday_hours?: number
          status?: string
          submitted_at?: string | null
          sunday_hours?: number
          thursday_hours?: number
          total_hours?: number
          tuesday_hours?: number
          updated_at?: string
          wednesday_hours?: number
          week_starting?: string
        }
        Relationships: []
      }
      visa_types: {
        Row: {
          country_id: string | null
          created_at: string
          description: string | null
          duration_months: number | null
          id: string
          is_active: boolean
          name: string
          requirements: Json | null
          updated_at: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          is_active?: boolean
          name: string
          requirements?: Json | null
          updated_at?: string
        }
        Update: {
          country_id?: string | null
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          is_active?: boolean
          name?: string
          requirements?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_types_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_employee_record: {
        Args: { record_id: string; table_name: string; user_id: string }
        Returns: undefined
      }
      calculate_compliance_score: {
        Args: { employee_uuid: string }
        Returns: number
      }
      calculate_immigration_status: {
        Args: { employee_uuid: string }
        Returns: Database["public"]["Enums"]["immigration_status_enum"]
      }
      calculate_prorata_leave_entitlement: {
        Args: {
          default_allocation?: number
          fiscal_year_start?: string
          hire_date: string
        }
        Returns: number
      }
      calculate_timesheet_hours: {
        Args: { break_minutes?: number; end_time: string; start_time: string }
        Returns: number
      }
      can_archive_records: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      can_hard_delete: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      can_view_sensitive_field: {
        Args: { field_type: string; user_uuid: string }
        Returns: boolean
      }
      cleanup_expired_import_previews: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_notification: {
        Args: {
          entity_id?: string
          entity_type?: string
          notification_message: string
          notification_metadata?: Json
          notification_priority?: Database["public"]["Enums"]["notification_priority"]
          notification_title: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          target_user_id: string
        }
        Returns: string
      }
      generate_document_hash: {
        Args: { content_text: string } | { file_content: string }
        Returns: string
      }
      generate_employee_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_default_company: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_direct_reports: {
        Args: { manager_uuid: string }
        Returns: {
          company_name: string
          department_name: string
          direct_reports_count: number
          email: string
          employee_number: string
          employee_type: Database["public"]["Enums"]["employee_type"]
          first_name: string
          id: string
          job_title_name: string
          last_name: string
          profile_photo: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["employee_status"]
        }[]
      }
      get_document_statistics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_employee_complete: {
        Args: { employee_uuid: string }
        Returns: Json
      }
      get_employee_complete_secure: {
        Args: { employee_uuid: string }
        Returns: Json
      }
      get_employee_id: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_leave_statistics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_organization_statistics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_organizational_hierarchy: {
        Args: Record<PropertyKey, never>
        Returns: {
          company_name: string
          department_name: string
          email: string
          employee_number: string
          employee_type: Database["public"]["Enums"]["employee_type"]
          first_name: string
          id: string
          job_title_name: string
          last_name: string
          level: number
          manager_id: string
          manager_name: string
          path: string[]
          profile_photo: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["employee_status"]
        }[]
      }
      get_rota_statistics: {
        Args: { end_date?: string; start_date?: string }
        Returns: Json
      }
      get_timesheet_statistics: {
        Args: {
          end_date?: string
          start_date?: string
          target_employee_id?: string
        }
        Returns: Json
      }
      get_unread_notification_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      import_rota_to_timesheet: {
        Args: { target_employee_id: string; target_week_start: string }
        Returns: {
          hours_imported: number
          shift_date: string
          status: string
          timesheet_id: string
        }[]
      }
      is_admin_only: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_admin_or_hr: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      log_security_event: {
        Args: { p_action: string; p_details?: Json; p_resource: string }
        Returns: string
      }
      mark_notifications_read: {
        Args: { notification_ids: string[] }
        Returns: number
      }
      recalculate_all_leave_entitlements: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      sync_employee_leave_balances: {
        Args: { target_year?: number }
        Returns: number
      }
      update_employee_immigration_status: {
        Args: { employee_uuid: string }
        Returns: undefined
      }
      update_employee_leave_entitlement: {
        Args: { employee_uuid: string }
        Returns: undefined
      }
      update_payslip_statuses: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      cos_status_enum: "Active" | "Inactive" | "Expired" | "Archived"
      document_category:
        | "personal"
        | "certificate"
        | "employment"
        | "financial"
        | "compliance"
        | "cos"
        | "rtw"
        | "sponsor_licence"
        | "immigration_medical"
      document_status:
        | "pending"
        | "approved"
        | "rejected"
        | "expired"
        | "under_review"
      employee_status:
        | "active"
        | "inactive"
        | "on_leave"
        | "terminated"
        | "archived"
      employee_type: "staff" | "manager" | "director" | "owner" | "executive"
      immigration_status_enum:
        | "pending_review"
        | "approved"
        | "rejected"
        | "expired"
        | "requires_renewal"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      leave_type:
        | "annual"
        | "sick"
        | "personal"
        | "maternity"
        | "paternity"
        | "bereavement"
      leave_type_enum:
        | "annual"
        | "sick"
        | "maternity"
        | "paternity"
        | "bereavement"
        | "personal"
      notification_priority: "low" | "medium" | "high" | "urgent"
      notification_type:
        | "leave_request"
        | "leave_approved"
        | "leave_rejected"
        | "document_expiry"
        | "timesheet_reminder"
        | "payslip_available"
        | "employee_update"
        | "system_alert"
      shift_status_enum:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      user_role: "admin" | "hr" | "manager" | "employee" | "director"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cos_status_enum: ["Active", "Inactive", "Expired", "Archived"],
      document_category: [
        "personal",
        "certificate",
        "employment",
        "financial",
        "compliance",
        "cos",
        "rtw",
        "sponsor_licence",
        "immigration_medical",
      ],
      document_status: [
        "pending",
        "approved",
        "rejected",
        "expired",
        "under_review",
      ],
      employee_status: [
        "active",
        "inactive",
        "on_leave",
        "terminated",
        "archived",
      ],
      employee_type: ["staff", "manager", "director", "owner", "executive"],
      immigration_status_enum: [
        "pending_review",
        "approved",
        "rejected",
        "expired",
        "requires_renewal",
      ],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      leave_type: [
        "annual",
        "sick",
        "personal",
        "maternity",
        "paternity",
        "bereavement",
      ],
      leave_type_enum: [
        "annual",
        "sick",
        "maternity",
        "paternity",
        "bereavement",
        "personal",
      ],
      notification_priority: ["low", "medium", "high", "urgent"],
      notification_type: [
        "leave_request",
        "leave_approved",
        "leave_rejected",
        "document_expiry",
        "timesheet_reminder",
        "payslip_available",
        "employee_update",
        "system_alert",
      ],
      shift_status_enum: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      user_role: ["admin", "hr", "manager", "employee", "director"],
    },
  },
} as const

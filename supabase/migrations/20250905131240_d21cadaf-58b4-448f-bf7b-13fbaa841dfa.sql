-- Create a view to simplify employee data fetching
CREATE OR REPLACE VIEW employee_complete_view AS
SELECT 
  e.*,
  c.name as company_name,
  jt.title as job_title_name,
  d.name as department_name,
  cn.name as current_nationality_name,
  sc.name as sponsored_by_company_name,
  m.first_name as manager_first_name,
  m.last_name as manager_last_name,
  m.employee_number as manager_employee_number,
  -- Aggregate work profile data
  wp.skills,
  wp.work_preferences,
  wp.performance_metrics,
  wp.career_goals,
  wp.availability,
  wp.remote_work_preference,
  wp.travel_willingness,
  wp.languages,
  wp.work_location,
  wp.work_phone,
  wp.work_email,
  wp.national_insurance_number as work_ni_number,
  wp.soc_number,
  wp.weekly_working_hours,
  wp.sponsored_by_company_id as work_sponsored_by_company_id
FROM employees e
LEFT JOIN companies c ON e.company_id = c.id
LEFT JOIN job_titles jt ON e.job_title = jt.id
LEFT JOIN departments d ON e.department = d.id
LEFT JOIN countries cn ON e.current_nationality_id = cn.id
LEFT JOIN companies sc ON e.sponsored_by_company_id = sc.id
LEFT JOIN employees m ON e.manager_id = m.id
LEFT JOIN employee_work_profiles wp ON e.id = wp.employee_id;

-- Create a function to get complete employee data
CREATE OR REPLACE FUNCTION get_employee_complete(employee_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Get employee data from the view
  SELECT to_jsonb(ecv.*) INTO result 
  FROM employee_complete_view ecv 
  WHERE ecv.id = employee_uuid;
  
  -- Add aggregated related data
  result := result || jsonb_build_object(
    'direct_reports_count', (
      SELECT COUNT(*) FROM employees WHERE manager_id = employee_uuid
    ),
    'passports', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', ep.id,
          'passport_number', ep.passport_number,
          'issuing_country', c.name,
          'issue_date', ep.issue_date,
          'expiry_date', ep.expiry_date,
          'status', ep.status,
          'is_current', ep.is_current,
          'document_path', ep.document_path
        )
      ), '[]'::jsonb)
      FROM employee_passports ep
      LEFT JOIN countries c ON ep.issuing_country_id = c.id
      WHERE ep.employee_id = employee_uuid
    ),
    'visas', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', ev.id,
          'visa_number', ev.visa_number,
          'visa_type', vt.name,
          'issuing_country', c.name,
          'issue_date', ev.issue_date,
          'expiry_date', ev.expiry_date,
          'is_current', ev.is_current,
          'conditions', ev.conditions,
          'document_path', ev.document_path
        )
      ), '[]'::jsonb)
      FROM employee_visas ev
      LEFT JOIN visa_types vt ON ev.visa_type_id = vt.id
      LEFT JOIN countries c ON ev.issuing_country_id = c.id
      WHERE ev.employee_id = employee_uuid
    ),
    'rtw_documents', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', rtw.id,
          'rtw_reference', rtw.rtw_reference,
          'rtw_status', rtw.rtw_status,
          'share_code', rtw.share_code,
          'checked_date', rtw.checked_date,
          'expiry_date', rtw.expiry_date,
          'is_current_active', rtw.is_current_active,
          'status', rtw.status,
          'document_path', rtw.document_path,
          'notes', rtw.notes
        )
      ), '[]'::jsonb)
      FROM employee_rtw_documents rtw
      WHERE rtw.employee_id = employee_uuid
    ),
    'cos_documents', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', cos.id,
          'cos_reference_number', cos.cos_reference_number,
          'certificate_number', cos.certificate_number,
          'license_number', cos.license_number,
          'assigned_date', cos.assigned_date,
          'certified_date', cos.certified_date,
          'cos_status', cos.cos_status,
          'sponsor_note', cos.sponsor_note,
          'document_path', cos.document_path,
          'notes', cos.notes
        )
      ), '[]'::jsonb)
      FROM employee_cos_documents cos
      WHERE cos.employee_id = employee_uuid
    ),
    'bank_details', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', eb.id,
          'bank_name', eb.bank_name,
          'account_holder_name', eb.account_holder_name,
          'account_number', eb.account_number,
          'sort_code', eb.sort_code,
          'iban', eb.iban,
          'swift_code', eb.swift_code,
          'currency_code', eb.currency_code,
          'verification_status', eb.verification_status,
          'is_primary', eb.is_primary,
          'is_active', eb.is_active
        )
      ), '[]'::jsonb)
      FROM employee_bank_details eb
      WHERE eb.employee_id = employee_uuid AND eb.is_active = true
    ),
    'certifications', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', ec.id,
          'certification_name', ec.certification_name,
          'issuing_organization', ec.issuing_organization,
          'certification_number', ec.certification_number,
          'issue_date', ec.issue_date,
          'expiry_date', ec.expiry_date,
          'is_active', ec.is_active,
          'requires_renewal', ec.requires_renewal,
          'document_path', ec.document_path
        )
      ), '[]'::jsonb)
      FROM employee_certifications ec
      WHERE ec.employee_id = employee_uuid AND ec.is_active = true
    ),
    'training', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', et.id,
          'training_name', et.training_name,
          'training_provider', et.training_provider,
          'training_type', et.training_type,
          'completion_date', et.completion_date,
          'expiry_date', et.expiry_date,
          'score', et.score,
          'status', et.status,
          'is_mandatory', et.is_mandatory,
          'document_path', et.document_path,
          'notes', et.notes
        )
      ), '[]'::jsonb)
      FROM employee_training et
      WHERE et.employee_id = employee_uuid
    ),
    'education', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', ee.id,
          'institution_name', ee.institution_name,
          'degree_type', ee.degree_type,
          'field_of_study', ee.field_of_study,
          'grade_gpa', ee.grade_gpa,
          'start_date', ee.start_date,
          'graduation_date', ee.graduation_date,
          'is_completed', ee.is_completed
        )
      ), '[]'::jsonb)
      FROM employee_education ee
      WHERE ee.employee_id = employee_uuid
    ),
    'leave_balances', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', lb.id,
          'leave_type', lb.leave_type,
          'allocated_days', lb.allocated_days,
          'used_days', lb.used_days,
          'carried_over_days', lb.carried_over_days,
          'year', lb.year
        )
      ), '[]'::jsonb)
      FROM leave_balances lb
      WHERE lb.employee_id = employee_uuid
    )
  );
  
  RETURN result;
END;
$$;
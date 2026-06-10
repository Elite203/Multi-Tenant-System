-- Update the get_employee_complete function to handle invalid UUIDs gracefully
CREATE OR REPLACE FUNCTION public.get_employee_complete(employee_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- Validate that the UUID is not null and properly formatted
  IF employee_uuid IS NULL THEN
    RAISE EXCEPTION 'Employee UUID cannot be null';
  END IF;

  -- Get employee data with direct joins instead of using a view
  SELECT to_jsonb(emp_data.*) INTO result FROM (
    SELECT 
      e.id,
      e.employee_number,
      e.first_name,
      e.last_name,
      e.email,
      e.phone,
      e.address,
      e.date_of_birth,
      e.national_insurance_number,
      e.profile_photo,
      e.start_date,
      e.hire_date,
      e.status,
      e.employee_type,
      e.salary,
      e.leave_entitlement,
      e.remaining_leaves,
      e.immigration_status,
      e.compliance_score,
      e.company_id,
      e.user_id,
      e.manager_id,
      e.sponsored_by_company_id,
      e.current_nationality_id,
      e.created_at,
      e.updated_at,
      e.archived_at,
      e.archived_by,
      c.name as company_name,
      jt.title as job_title_name,
      d.name as department_name,
      cn.name as current_nationality_name,
      sc.name as sponsored_by_company_name,
      CONCAT(m.first_name, ' ', m.last_name) as manager_name,
      m.first_name as manager_first_name,
      m.last_name as manager_last_name,
      m.employee_number as manager_employee_number,
      (SELECT COUNT(*) FROM employees WHERE manager_id = e.id) as direct_reports_count
    FROM public.employees e
    LEFT JOIN public.companies c ON e.company_id = c.id
    LEFT JOIN public.job_titles jt ON e.job_title = jt.id
    LEFT JOIN public.departments d ON e.department = d.id
    LEFT JOIN public.countries cn ON e.current_nationality_id = cn.id
    LEFT JOIN public.companies sc ON e.sponsored_by_company_id = sc.id
    LEFT JOIN public.employees m ON e.manager_id = m.id
    WHERE e.id = employee_uuid
  ) emp_data;
  
  -- Check if employee was found
  IF result IS NULL THEN
    RAISE EXCEPTION 'Employee with ID % not found', employee_uuid;
  END IF;

  -- Add aggregated related data
  result := result || jsonb_build_object(
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
$function$;
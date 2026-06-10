-- Make employee_id nullable to allow company documents
ALTER TABLE documents ALTER COLUMN employee_id DROP NOT NULL;
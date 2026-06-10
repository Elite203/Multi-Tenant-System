-- Create missing job titles identified from import data
INSERT INTO public.job_titles (title, description, is_active) VALUES
  ('Sandwich Artist', 'Responsible for preparing food items and serving customers', true),
  ('Sales Assistant', 'Assists customers with purchases and maintains store appearance', true),
  ('Owner', 'Business owner and operator', true),
  ('Store Supervisor', 'Supervises store operations and staff', true),
  ('Customer Service Representative', 'Handles customer inquiries and support', true),
  ('Cashier', 'Processes customer transactions', true),
  ('Team Leader', 'Leads and coordinates team activities', true),
  ('Assistant Manager', 'Assists in managing daily operations', true)
ON CONFLICT (title) DO NOTHING;
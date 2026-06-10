-- Check if system_settings table exists and has correct structure
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_settings') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE public.system_settings (
            id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            setting_key text NOT NULL UNIQUE,
            setting_value jsonb NOT NULL,
            description text,
            is_active boolean NOT NULL DEFAULT true,
            created_at timestamp with time zone NOT NULL DEFAULT now(),
            updated_at timestamp with time zone NOT NULL DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Admins can manage system settings" ON public.system_settings FOR ALL USING (is_admin_only(auth.uid()));
        CREATE POLICY "Everyone can view system settings" ON public.system_settings FOR SELECT USING (true);
        
        -- Add trigger
        CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        
        -- Insert default settings
        INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
            ('rota_module_enabled', '{"value": true}', 'Enable/disable ROTA scheduling module'),
            ('default_shift_duration', '{"value": 8}', 'Default shift duration in hours'),
            ('max_parent_companies', '{"value": 5}', 'Maximum number of parent companies allowed'),
            ('max_child_companies', '{"value": 50}', 'Maximum number of child companies per parent'),
            ('default_leave_allocation', '{"value": 25}', 'Default annual leave allocation in days');
    ELSE
        -- Table exists, check if is_active column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'is_active') THEN
            ALTER TABLE public.system_settings ADD COLUMN is_active boolean NOT NULL DEFAULT true;
        END IF;
    END IF;
END $$;
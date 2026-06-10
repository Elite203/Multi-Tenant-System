// /pages/api/tenantLogin.js

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client'; // Master DB client

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Get subdomain from request host
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];

    // Fetch tenant info from master DB
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', subdomain)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Create Supabase client for tenant project
    const tenantClient = createClient(
      `https://${tenant.tenantid}.supabase.co`,  // tenant Supabase URL
      tenant.tenantservicekey                     // tenant service key
    );

    // Authenticate user using tenant Supabase auth
    const { data: sessionData, error: authError } = await tenantClient.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !sessionData?.user) {
      return res.status(401).json({ error: authError?.message || 'Invalid credentials' });
    }

    return res.status(200).json({ 
      user: sessionData.user, 
      session: sessionData.session 
    });

  } catch (err) {
    console.error('Tenant login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

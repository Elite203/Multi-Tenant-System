import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password, subdomain: bodySubdomain } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // 1️⃣ Detect subdomain dynamically
    const host = req.headers.host || '';
    let subdomain = bodySubdomain || host.split('.')[0];

    // Validate subdomain
    if (!subdomain || ['rjdh', 'www', 'localhost'].includes(subdomain)) {
      return res.status(400).json({ error: 'Invalid tenant subdomain', debug: { host, subdomain } });
    }

    // 2️⃣ Master Supabase client
    const masterClient = createClient(process.env.MASTER_SUPABASE_URL, process.env.MASTER_SUPABASE_KEY);

    // Fetch tenant info from master DB
    const { data: tenantData, error: tenantError } = await masterClient
      .from('tenants')
      .select('*')
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (!tenantData) {
      return res.status(404).json({ error: 'Tenant not found', debug: { tenantError, subdomain } });
    }

    // 3️⃣ Build tenant URL
    const tenantUrl = tenantData.tenanturl || `https://${tenantData.tenantid}.supabase.co`;

    // 🔹 Debug: print info
    console.log('Tenant Subdomain:', subdomain);
    console.log('Tenant Project ID:', tenantData.tenantid);
    console.log('Tenant Project URL:', tenantUrl);
    console.log('Tenant Service Key:', tenantData.tenantservicekey);

    // 4️⃣ Tenant Supabase client (service role)
    const tenantClient = createClient(tenantUrl, tenantData.tenantservicekey);

    // 5️⃣ Test connection to tenantusers table
    const { data: testData, error: testError } = await tenantClient
      .from('tenantusers')
      .select('id')
      .limit(1);

    if (testError) {
      return res.status(500).json({
        error: 'Could not connect to tenant database',
        debug: { testError, tenant_id: tenantData.tenantid, tenant_url: tenantUrl, tenant_service_key: tenantData.tenantservicekey }
      });
    }

    // 6️⃣ Query tenantusers table for login
    const { data: userData, error: userError } = await tenantClient
      .from('tenantusers')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();

    if (!userData) {
      return res.status(401).json({
        error: 'Invalid email or password',
        debug: { userError, email, tenant_id: tenantData.tenantid, tenant_url: tenantUrl }
      });
    }

    // 7️⃣ Success response
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: userData.id,
        email: userData.email,
        created_at: userData.created_at,
      },
      debug: { subdomain, tenant_id: tenantData.tenantid, tenant_url: tenantUrl, tenant_service_key: tenantData.tenantservicekey }
    });

  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', debug: { message: err.message, stack: err.stack } });
  }
}

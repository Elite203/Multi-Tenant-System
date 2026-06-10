import { createClient } from "@supabase/supabase-js";

// Use master database credentials with service role key for admin operations
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 Supabase Client Config:");
console.log("  URL:", supabaseUrl);
console.log("  Key exists:", !!supabaseKey);
console.log("  Using service role:", supabaseKey && supabaseKey.includes('service_role'));

export const supabase = createClient(supabaseUrl, supabaseKey);
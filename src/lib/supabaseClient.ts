/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const manualUrl = typeof window !== 'undefined' ? localStorage.getItem('ALFA_MANUAL_DB_URL') : null;
  const manualKey = typeof window !== 'undefined' ? localStorage.getItem('ALFA_MANUAL_DB_KEY') : null;
  
  let url = manualUrl || import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = manualKey || import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder";
  
  // Clean URL: Remove trailing slashes and /rest/v1 suffix which users often copy by mistake
  url = url.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  
  return { url, key };
};

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();

if (!supabaseUrl.includes('placeholder') && !supabaseUrl.includes('supabase.co')) {
  console.warn('Supabase URL might be invalid format.');
}

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  if (typeof window !== 'undefined' && !localStorage.getItem('ALFA_MANUAL_DB_URL')) {
    console.warn('Supabase credentials are missing. App will run in offline mode using mock data.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

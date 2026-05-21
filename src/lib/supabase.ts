import { createClient } from '@supabase/supabase-js';

// Extraemos las variables de entorno que configuraste en el .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;



// Creamos y exportamos el cliente para usarlo en toda la app
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
  });
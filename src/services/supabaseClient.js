import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to synchronize user with Django backend
export const syncUserWithDjango = async (userData) => {
  try {
    const { data, error } = await supabase.functions.invoke('sync-user-with-django', {
      body: userData
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error syncing user with Django:', error);
    return { data: null, error };
  }
};
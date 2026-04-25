import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

const createDummyClient = () => {
  console.warn('Supabase credentials missing or invalid. Database features will be limited.');
  return {
    from: () => ({
      select: () => ({ 
        eq: () => ({ 
          single: () => Promise.resolve({ data: null, error: new Error('Missing Supabase Keys') }),
          order: () => ({ select: () => Promise.resolve({ data: [], error: new Error('Missing Supabase Keys') }) })
        }),
        order: () => ({ 
          limit: () => Promise.resolve({ data: [], error: new Error('Missing Supabase Keys') }),
          select: () => Promise.resolve({ data: [], error: new Error('Missing Supabase Keys') }) 
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: new Error('Missing Supabase Keys') }),
      update: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Missing Supabase Keys') }) }) }),
    }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  } as any;
};

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance;

  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Limpa a URL se o usuário colou com /rest/v1/ ou barra final
  if (typeof supabaseUrl === 'string') {
    supabaseUrl = supabaseUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  }

  // Basic validation: must exist, be a string, start with http, and not be the placeholder
  const isValidUrl = (url: any) => {
    try {
      return typeof url === 'string' && 
             url.startsWith('http') && 
             !url.includes('YOUR_PROJECT_REF') &&
             url.length > 10;
    } catch {
      return false;
    }
  };

  if (!isValidUrl(supabaseUrl) || !supabaseAnonKey || supabaseAnonKey.includes('YOUR_ANON_KEY')) {
    return createDummyClient();
  }

  try {
    supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey);
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return createDummyClient();
  }
})();

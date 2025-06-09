import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: { 'x-my-custom-header': 'my-app-name' },
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    },
    maxRetries: 3,
    timeout: 20000
  }
);
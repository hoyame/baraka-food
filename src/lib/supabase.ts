import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

supabase.auth.getSession().then(({ data }) => {
  if (!data.session) {
    supabase.auth.signInWithPassword({
      email: import.meta.env.VITE_STAFF_EMAIL,
      password: import.meta.env.VITE_STAFF_PASSWORD,
    })
  }
})

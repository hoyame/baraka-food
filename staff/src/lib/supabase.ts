import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data }) => {
    if (!data.session) {
      supabase.auth.signInWithPassword({
        email: process.env.NEXT_PUBLIC_STAFF_EMAIL!,
        password: process.env.NEXT_PUBLIC_STAFF_PASSWORD!,
      })
    }
  })
}

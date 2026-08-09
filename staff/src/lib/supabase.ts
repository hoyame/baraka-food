import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

async function signIn() {
  await supabase.auth.signInWithPassword({
    email: process.env.NEXT_PUBLIC_STAFF_EMAIL!,
    password: process.env.NEXT_PUBLIC_STAFF_PASSWORD!,
  })
}

export const authReady: Promise<void> =
  typeof window === 'undefined'
    ? Promise.resolve()
    : (async () => {
        try {
          const { data } = await supabase.auth.getSession()
          if (data.session) {
            const { error } = await supabase.auth.getUser()
            if (!error) return
          }
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
          await signIn()
        } catch {
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
          await signIn().catch(() => {})
        }
      })()

if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.access_token) supabase.realtime.setAuth(session.access_token)
    if (!session && event !== 'INITIAL_SESSION') signIn().catch(() => {})
  })
}

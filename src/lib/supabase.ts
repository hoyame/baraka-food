import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

async function signIn() {
  await supabase.auth.signInWithPassword({
    email: import.meta.env.VITE_STAFF_EMAIL,
    password: import.meta.env.VITE_STAFF_PASSWORD,
  })
}

export const authReady: Promise<void> = (async () => {
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

supabase.auth.onAuthStateChange((event, session) => {
  if (session?.access_token) supabase.realtime.setAuth(session.access_token)
  if (!session && event !== 'INITIAL_SESSION') signIn().catch(() => {})
})

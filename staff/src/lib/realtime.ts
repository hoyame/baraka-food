import { authReady, supabase } from './supabase'

export function watchTable(
  name: string,
  table: string,
  onChange: () => void,
  options: { pollMs?: number } = {},
) {
  const { pollMs = 15000 } = options
  let alive = true
  let channel: ReturnType<typeof supabase.channel> | null = null
  let retry: ReturnType<typeof setTimeout> | null = null

  const open = () => {
    if (!alive) return
    if (retry) {
      clearTimeout(retry)
      retry = null
    }
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
    channel = supabase
      .channel(`${name}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
      .subscribe((status) => {
        if (!alive) return
        if (status === 'SUBSCRIBED') {
          onChange()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          retry = setTimeout(open, 3000)
        }
      })
  }

  authReady.then(open)

  const poll = setInterval(onChange, pollMs)

  const revive = () => {
    if (document.visibilityState !== 'visible') return
    onChange()
    open()
  }
  document.addEventListener('visibilitychange', revive)
  window.addEventListener('online', revive)

  return () => {
    alive = false
    clearInterval(poll)
    if (retry) clearTimeout(retry)
    document.removeEventListener('visibilitychange', revive)
    window.removeEventListener('online', revive)
    if (channel) supabase.removeChannel(channel)
  }
}

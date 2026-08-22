import { authReady, supabase } from './supabase'

export type LinkStatus = 'live' | 'reconnecting' | 'offline'

export function watchTable(
  name: string,
  table: string,
  onChange: () => void,
  options: { pollMs?: number; onStatus?: (s: LinkStatus) => void } = {},
) {
  const { pollMs = 120000, onStatus } = options
  const report = (s: LinkStatus) => onStatus?.(navigator.onLine ? s : 'offline')
  let alive = true
  let channel: ReturnType<typeof supabase.channel> | null = null
  let retry: ReturnType<typeof setTimeout> | null = null
  let generation = 0
  let retryDelay = 3000

  const open = () => {
    if (!alive) return
    if (retry) {
      clearTimeout(retry)
      retry = null
    }
    const gen = ++generation
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
    channel = supabase
      .channel(`${name}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
      .subscribe((status) => {
        if (!alive || gen !== generation) return
        if (status === 'SUBSCRIBED') {
          retryDelay = 3000
          report('live')
          onChange()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          report('reconnecting')
          retry = setTimeout(open, retryDelay)
          retryDelay = Math.min(retryDelay * 2, 60000)
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
  const offline = () => onStatus?.('offline')

  document.addEventListener('visibilitychange', revive)
  window.addEventListener('online', revive)
  window.addEventListener('offline', offline)
  if (!navigator.onLine) offline()

  return () => {
    alive = false
    clearInterval(poll)
    if (retry) clearTimeout(retry)
    document.removeEventListener('visibilitychange', revive)
    window.removeEventListener('online', revive)
    window.removeEventListener('offline', offline)
    if (channel) supabase.removeChannel(channel)
  }
}

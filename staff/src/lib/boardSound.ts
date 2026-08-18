import { supabase } from './supabase'

let channel: ReturnType<typeof supabase.channel> | null = null
let ready: Promise<void> | null = null

function ensureChannel(): Promise<void> {
  if (ready) return ready
  ready = new Promise((resolve, reject) => {
    channel = supabase.channel('board-sound')
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve()
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        ready = null
        reject(new Error('canal indisponible'))
      }
    })
  })
  return ready
}

export async function setBoardSound(on: boolean): Promise<boolean> {
  try {
    await ensureChannel()
    const res = await channel!.send({ type: 'broadcast', event: 'set', payload: { on } })
    return res === 'ok'
  } catch {
    return false
  }
}

import { supabase } from './supabase'
import type { Order } from './types'

let channel: ReturnType<typeof supabase.channel> | null = null
let ready: Promise<void> | null = null

function ensureChannel(): Promise<void> {
  if (ready) return ready
  ready = new Promise((resolve, reject) => {
    channel = supabase.channel('reprint')
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

export async function sendReprint(order: Order): Promise<boolean> {
  try {
    await ensureChannel()
    const res = await channel!.send({
      type: 'broadcast',
      event: 'reprint',
      payload: { order: { code: order.code, items: order.items, created_at: order.created_at } },
    })
    return res === 'ok'
  } catch {
    return false
  }
}

import { useEffect, useRef, useState } from 'react'
import { authReady, supabase } from '../lib/supabase'

const DISPLAY_MS = 15000

function annonce(code: string) {
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    const spelled = code.replace(/([A-Za-z])(\d+)/, '$1 $2')
    const say = (voice: SpeechSynthesisVoice | undefined) => {
      const utter = new SpeechSynthesisUtterance(`Commande ${spelled}, prête`)
      utter.lang = 'fr-FR'
      utter.rate = 0.92
      utter.volume = 1
      if (voice) utter.voice = voice
      synth.speak(utter)
    }
    const fr = synth.getVoices().find(v => v.lang.startsWith('fr'))
    synth.cancel()
    say(fr)
    setTimeout(() => say(fr), 4000)
  } catch {
    // synthese vocale indisponible
  }
}

export function useReadyOrders(options: { announce?: boolean } = {}) {
  const { announce = true } = options
  const [current, setCurrent] = useState<string | null>(null)
  const knownStatus = useRef<Record<string, string>>({})
  const queue = useRef<string[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let alive = true

    function playNext() {
      if (timerRef.current) return
      const next = queue.current.shift()
      if (!next) {
        setCurrent(null)
        return
      }
      setCurrent(next)
      if (announce) annonce(next)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        playNext()
      }, DISPLAY_MS)
    }

    let channel: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const { data } = await supabase.from('orders').select('code, status')
      if (!alive || !data) return
      for (const o of data) knownStatus.current[o.code] = o.status
    }

    authReady.then(async () => {
      if (!alive) return
      await init()
      if (!alive) return
      channel = subscribe()
    })

    function subscribe() {
      return supabase
      .channel('orders-ready-banner')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        const row = payload.new as { code?: string; status?: string } | undefined
        if (!row?.code) return
        const wasDisponible = knownStatus.current[row.code] === 'disponible'
        knownStatus.current[row.code] = row.status || knownStatus.current[row.code]
        if (row.status === 'disponible' && !wasDisponible) {
          queue.current.push(row.code)
          playNext()
        }
      })
      .subscribe()
    }

    return () => {
      alive = false
      if (channel) supabase.removeChannel(channel)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [announce])

  return current
}

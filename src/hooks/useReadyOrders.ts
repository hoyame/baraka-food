import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { watchTable } from '../lib/realtime'

const DISPLAY_MS = 15000

function sonActif(): boolean {
  try {
    return localStorage.getItem('board-son') !== '0'
  } catch {
    return true
  }
}

function annonce(code: string) {
  if (!sonActif()) return
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    const spelled = code.replace(/^(SP|EP|LV|EMP|LIV)-/i, '').replace(/([A-Za-z])(\d+)/, '$1 $2')
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

    async function sync() {
      const { data } = await supabase.from('orders').select('code, status')
      if (!alive || !data) return
      for (const o of data) {
        const wasDisponible = knownStatus.current[o.code] === 'disponible'
        const first = knownStatus.current[o.code] === undefined
        knownStatus.current[o.code] = o.status
        if (o.status === 'disponible' && !wasDisponible && !first && !/^(LV|LIV)-/i.test(o.code)) {
          queue.current.push(o.code)
          playNext()
        }
      }
    }

    const stop = watchTable('orders-ready', 'orders', () => { sync() })

    const sonChannel = supabase
      .channel('board-sound')
      .on('broadcast', { event: 'set' }, ({ payload }) => {
        try {
          localStorage.setItem('board-son', payload?.on === false ? '0' : '1')
        } catch {}
      })
      .subscribe()

    return () => {
      alive = false
      stop()
      supabase.removeChannel(sonChannel)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [announce])

  return current
}

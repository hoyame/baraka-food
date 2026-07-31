import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import './ReadyOrdersBanner.scss'

const DISPLAY_MS = 15000

let audioCtx: AudioContext | null = null

function chime() {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtx = new Ctor()
    }
    const ctx = audioCtx

    const play = () => {
      const notes = [660, 880]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        const start = ctx.currentTime + i * 0.18
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.22, start + 0.02)
        gain.gain.linearRampToValueAtTime(0, start + 0.35)
        osc.start(start)
        osc.stop(start + 0.4)
      })
    }

    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => {})
    } else {
      play()
    }
  } catch {
    // audio non disponible
  }
}

export default function ReadyOrdersBanner() {
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
      chime()
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        playNext()
      }, DISPLAY_MS)
    }

    async function init() {
      const { data } = await supabase.from('orders').select('code, status')
      if (!alive || !data) return
      for (const o of data) knownStatus.current[o.code] = o.status
    }
    init()

    const channel = supabase
      .channel('orders-ready-banner')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
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

    return () => {
      alive = false
      supabase.removeChannel(channel)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current}
          className="ready-banner"
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <span className="ready-banner__label">Commande prête</span>
          <span className="ready-banner__code">{current}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

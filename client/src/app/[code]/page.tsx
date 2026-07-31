'use client'

import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from './page.module.scss'

type Status = 'attente' | 'preparation' | 'pret_cuisine' | 'disponible' | 'recuperee'

interface Order {
  code: string
  status: Status
  items: { name: string; qty: number; price: number; notes: string }[]
}

const copy: Record<Status, { title: string; desc: string }> = {
  attente: { title: 'Commande enregistrée', desc: 'Votre commande va être prise en charge en cuisine.' },
  preparation: { title: 'En préparation', desc: "On vous prévient dès que c'est prêt." },
  pret_cuisine: { title: 'Bientôt prête', desc: 'Votre commande arrive au comptoir.' },
  disponible: { title: 'Votre commande est prête !', desc: 'Merci de venir la récupérer au comptoir.' },
  recuperee: { title: 'Commande récupérée', desc: 'Merci et bon appétit !' },
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch {}
  if (navigator.vibrate) navigator.vibrate([200, 100, 200])
}

export default function SuiviPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = use(params)
  const code = rawCode.toUpperCase()
  const [order, setOrder] = useState<Order | null | undefined>(undefined)
  const lastStatus = useRef<Status | null>(null)
  const wasFound = useRef(false)

  useEffect(() => {
    let alive = true

    async function load() {
      const { data } = await supabase.from('orders').select('*').eq('code', code).maybeSingle()
      if (!alive) return

      if (data) {
        wasFound.current = true
        setOrder(data)
      } else if (wasFound.current) {
        // la ligne a été supprimée après récupération par le comptoir
        setOrder({ code, status: 'recuperee', items: [] })
      } else {
        setOrder(null)
      }
    }
    load()

    // pas de filtre côté serveur : un DELETE ne transporte pas toujours le code,
    // on se contente du signal "quelque chose a changé" et on recharge par code
    const channel = supabase
      .channel('orders-client-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe()

    return () => {
      alive = false
      supabase.removeChannel(channel)
    }
  }, [code])

  useEffect(() => {
    if (order?.status === 'disponible' && lastStatus.current !== 'disponible') {
      beep()
    }
    lastStatus.current = order?.status ?? null
  }, [order?.status])

  const info = order === null
    ? { title: 'Commande introuvable', desc: 'Vérifiez le numéro avec le comptoir.' }
    : order
      ? copy[order.status]
      : { title: 'Chargement…', desc: '' }

  const isReady = order?.status === 'disponible'

  return (
    <main className={styles.main}>
      <div className={styles.wrap}>
        <p className={styles.code}>Commande {code}</p>

        <div className={`${styles.box}${isReady ? ` ${styles.boxReady}` : ''}`}>
          {order !== null && order?.status !== 'disponible' && <span className={styles.dot} />}
          <h1 className={styles.title}>{info.title}</h1>
          <p className={styles.desc}>{info.desc}</p>
        </div>

        <Link className={styles.changeLink} href="/">Changer de numéro</Link>
      </div>
    </main>
  )
}

'use client'

import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  notificationsGranted,
  notificationsSupported,
  notify,
  registerSw,
  requestNotifications,
} from '@/lib/notifications'
import InstallPrompt from '@/components/InstallPrompt'
import styles from './page.module.scss'

type Status = 'attente' | 'preparation' | 'pret_cuisine' | 'disponible' | 'recuperee'

interface Order {
  code: string
  status: Status
  items: { name: string; qty: number; price: number; notes: string }[]
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://barakafood.fr'
const REVIEW_URL = 'https://g.page/r/Cb8Ja6Z72htXEAE/review'

const copy: Record<Status, { title: string; desc: string }> = {
  attente: { title: 'Commande enregistrée', desc: 'Votre commande va être prise en charge en cuisine.' },
  preparation: { title: 'En préparation', desc: "On vous prévient dès que c'est prêt." },
  pret_cuisine: { title: 'Bientôt prête', desc: 'Votre commande arrive au comptoir.' },
  disponible: { title: 'Votre commande est prête !', desc: 'Merci de venir la récupérer au comptoir.' },
  recuperee: { title: 'Commande récupérée', desc: 'Merci et bon appétit !' },
}

const notifCopy: Record<Status, string> = {
  attente: 'Commande enregistrée',
  preparation: 'Votre commande est en préparation',
  pret_cuisine: 'Votre commande est bientôt prête',
  disponible: 'Votre commande est prête ! Venez la récupérer au comptoir',
  recuperee: 'Commande récupérée — merci et bon appétit !',
}

let audioCtx: AudioContext | null = null

function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
  } catch {}
}

function beep() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.5)
  } catch {}
  if (navigator.vibrate) navigator.vibrate([200, 100, 200])
}

export default function SuiviPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = use(params)
  const code = rawCode.toUpperCase()
  const [order, setOrder] = useState<Order | null | undefined>(undefined)
  const [notifState, setNotifState] = useState<'unsupported' | 'idle' | 'granted' | 'denied'>('idle')
  const lastStatus = useRef<Status | null>(null)
  const wasFound = useRef(false)

  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('touchend', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchend', unlock)
    }
  }, [])

  useEffect(() => {
    if (!notificationsSupported()) {
      setNotifState('unsupported')
      return
    }
    if (notificationsGranted()) {
      setNotifState('granted')
      registerSw()
    } else if (Notification.permission === 'denied') {
      setNotifState('denied')
    }
  }, [])

  async function enableNotifications() {
    const ok = await requestNotifications()
    setNotifState(ok ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'idle')
    if (ok) notify('Notifications activées', `On vous préviendra ici pour la commande ${code}.`)
  }

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
    const status = order?.status
    if (!status) return
    if (lastStatus.current !== null && lastStatus.current !== status) {
      notify(`Commande ${code}`, notifCopy[status], window.location.href)
      if (status === 'disponible') beep()
    } else if (status === 'disponible' && lastStatus.current !== 'disponible') {
      beep()
    }
    lastStatus.current = status
  }, [order?.status, code])

  const info = order === null
    ? { title: 'Commande introuvable', desc: 'Vérifiez le numéro avec le comptoir.' }
    : order
      ? copy[order.status]
      : { title: 'Chargement…', desc: '' }

  const isReady = order?.status === 'disponible'
  const isDone = order?.status === 'recuperee'

  return (
    <main className={styles.main}>
      <div className={styles.wrap}>
        <p className={styles.code}>Commande {code}</p>

        <div className={`${styles.box}${isReady ? ` ${styles.boxReady}` : ''}`}>
          {order !== null && order?.status !== 'disponible' && <span className={styles.dot} />}
          <h1 className={styles.title}>{info.title}</h1>
          <p className={styles.desc}>{info.desc}</p>
        </div>

        {order && !isReady && !isDone && notifState === 'idle' && (
          <button className={styles.notifBtn} onClick={enableNotifications}>
            Me prévenir sur ce téléphone
          </button>
        )}
        {notifState === 'granted' && order && !isReady && !isDone && (
          <p className={styles.notifOk}>Notifications activées — vous serez prévenu à chaque étape.</p>
        )}
        {notifState === 'denied' && order && !isReady && !isDone && (
          <p className={styles.notifOk}>
            Notifications bloquées par le navigateur — gardez cette page ouverte.
          </p>
        )}

        {(isReady || isDone) && (
          <a className={styles.reviewBtn} href={REVIEW_URL} target="_blank" rel="noopener noreferrer">
            ★ Donnez votre avis sur Google
          </a>
        )}

        {order && <InstallPrompt />}

        <div className={styles.links}>
          <Link className={styles.changeLink} href="/">Changer de numéro</Link>
          <a className={styles.changeLink} href={SITE_URL}>Retour sur barakafood.fr</a>
        </div>
      </div>
    </main>
  )
}

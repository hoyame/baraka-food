'use client'

import { useEffect, useRef, useState } from 'react'
import StaffNav from '@/components/StaffNav'
import { Toast, useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import { watchTable } from '@/lib/realtime'
import { playNewOrderChime, unlockAudio } from '@/lib/chime'
import { sendReprint } from '@/lib/reprint'
import type { Order, OrderStatus } from '@/lib/types'
import styles from './page.module.scss'

const columns: { key: OrderStatus; label: string }[] = [
  { key: 'attente', label: 'En attente' },
  { key: 'preparation', label: 'En préparation' },
  { key: 'pret_cuisine', label: 'Prêt en cuisine' },
]

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  attente: 'preparation',
  preparation: 'pret_cuisine',
}

const nextLabel: Partial<Record<OrderStatus, string>> = {
  attente: 'Démarrer',
  preparation: 'Prêt',
}

const trackLabelToast: Partial<Record<OrderStatus, string>> = {
  preparation: 'En préparation',
  pret_cuisine: 'Prêt en cuisine',
}

export default function CuisinePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [soundOn, setSoundOn] = useState(false)
  const soundOnRef = useRef(false)
  const seenCodes = useRef<Set<string> | null>(null)
  const { toast, show } = useToast()

  useEffect(() => {
    if (localStorage.getItem('cuisine-son') === '1') {
      const ok = unlockAudio()
      setSoundOn(ok)
      soundOnRef.current = ok
    }
  }, [])

  function toggleSound() {
    if (soundOn) {
      setSoundOn(false)
      soundOnRef.current = false
      localStorage.setItem('cuisine-son', '0')
      return
    }
    unlockAudio()
    setSoundOn(true)
    soundOnRef.current = true
    localStorage.setItem('cuisine-son', '1')
    playNewOrderChime()
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('orders').select('*').not('status', 'in', '(disponible,recuperee)')
      const list = (data as Order[]) || []
      setOrders(list)

      const codes = new Set(list.map((o) => o.code))
      if (seenCodes.current === null) {
        seenCodes.current = codes
        return
      }
      const nouveaux = list.filter((o) => o.status === 'attente' && !seenCodes.current!.has(o.code))
      seenCodes.current = codes
      if (nouveaux.length > 0 && soundOnRef.current) playNewOrderChime()
    }
    load()

    return watchTable('orders-cuisine', 'orders', load)
  }, [])

  async function reprint(order: Order) {
    const ok = await sendReprint(order)
    show(ok ? `${order.code} → réimpression envoyée` : 'Réimpression impossible — imprimante hors ligne ?')
  }

  async function advance(code: string, status: OrderStatus) {
    show(`${code} → ${trackLabelToast[status]}`)
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('code', code)
  }

  return (
    <main className={styles.main}>
      <StaffNav />
      <div className={styles.wrap}>
        <div className={styles.soundBar}>
          <button
            className={`${styles.soundBtn}${soundOn ? ` ${styles.soundBtnOn}` : ''}`}
            onClick={toggleSound}
            aria-pressed={soundOn}
          >
            {soundOn ? 'Son activé' : 'Activer le son'}
          </button>
        </div>
        <div className={styles.columns}>
          {columns.map((col) => {
            const list = orders
              .filter((o) => o.status === col.key)
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

            return (
              <div key={col.key}>
                <p className={styles.colTitle}>{col.label}</p>
                <div className={styles.colList}>
                  {list.length === 0 && <div className={styles.empty}>Aucune commande</div>}
                  {list.map((order) => (
                    <div key={order.code} className={styles.card}>
                      <div className={styles.cardHead}>
                        <span className={styles.code}>{order.code}</span>
                        <button className={styles.reprintBtn} onClick={() => reprint(order)} title="Réimprimer le ticket">
                          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                            <path d="M6 9V3h12v6M6 18h12v3H6zM4 9h16a2 2 0 0 1 2 2v5h-4M2 16h4v-5a2 2 0 0 0-2-2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <span className={styles.time}>
                          {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={styles.items}>
                        {order.items.map((item, i) => (
                          <div key={i} className={styles.itemBlock}>
                            <div className={styles.itemLine}>{item.qty > 1 ? `${item.qty}x ` : ''}{item.name}</div>
                            {item.removed.length > 0 && (
                              <div className={styles.itemRemoved}>Sans : {item.removed.join(', ')}</div>
                            )}
                            {item.added.length > 0 && (
                              <div className={styles.itemAdded}>+ {item.added.join(', ')}</div>
                            )}
                            {item.notes && <div className={styles.itemNotes}>{item.notes}</div>}
                          </div>
                        ))}
                      </div>
                      {nextStatus[order.status] && (
                        <button className={styles.btn} onClick={() => advance(order.code, nextStatus[order.status]!)}>
                          {nextLabel[order.status]}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <Toast toast={toast} />
    </main>
  )
}

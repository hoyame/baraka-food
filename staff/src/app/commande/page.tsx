'use client'

import { useEffect, useState } from 'react'
import StaffNav from '@/components/StaffNav'
import { Toast, useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import { watchTable } from '@/lib/realtime'
import { sendReprint } from '@/lib/reprint'
import type { Order, OrderStatus } from '@/lib/types'
import styles from './page.module.scss'

const statusLabel: Record<OrderStatus, string> = {
  attente: 'En attente',
  preparation: 'En préparation',
  pret_cuisine: 'Prêt en cuisine',
  disponible: 'Au comptoir',
  recuperee: 'Récupérée',
}

export default function CommandePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const { toast, show } = useToast()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      setOrders((data as Order[]) || [])
    }
    load()
    return watchTable('orders-commande', 'orders', load)
  }, [])

  async function reprint(order: Order) {
    const ok = await sendReprint(order)
    show(ok ? `${order.code} → réimpression envoyée` : 'Réimpression impossible — imprimante hors ligne ?')
  }

  return (
    <main className={styles.main}>
      <StaffNav />
      <div className={styles.wrap}>
        <p className={styles.title}>Toutes les commandes</p>
        <p className={styles.hint}>
          Les commandes récupérées sont retirées de la liste. Le bouton renvoie le ticket sur
          l&apos;imprimante cuisine.
        </p>
        <div className={styles.list}>
          {orders.length === 0 && <div className={styles.empty}>Aucune commande</div>}
          {orders.map((order) => (
            <div key={order.code} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.code}>{order.code}</span>
                <span className={styles.status}>{statusLabel[order.status]}</span>
                <span className={styles.time}>
                  {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button className={styles.reprintBtn} onClick={() => reprint(order)} title="Réimprimer le ticket">
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path d="M6 9V3h12v6M6 18h12v3H6zM4 9h16a2 2 0 0 1 2 2v5h-4M2 16h4v-5a2 2 0 0 0-2-2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  </svg>
                  <span>Réimprimer</span>
                </button>
              </div>
              <div className={styles.items}>
                {order.items.map((item, i) => (
                  <span key={i} className={styles.item}>
                    {item.qty > 1 ? `${item.qty}× ` : ''}{item.name}
                    {item.added.length > 0 && <em> + {item.added.join(', ')}</em>}
                    {item.removed.length > 0 && <em> — sans {item.removed.join(', ')}</em>}
                    {item.notes && <em> ({item.notes})</em>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Toast toast={toast} />
    </main>
  )
}

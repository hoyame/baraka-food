'use client'

import { useEffect, useState } from 'react'
import StaffNav from '@/components/StaffNav'
import { Toast, useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
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
  const { toast, show } = useToast()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('orders').select('*').not('status', 'in', '(disponible,recuperee)')
      setOrders((data as Order[]) || [])
    }
    load()

    const channel = supabase
      .channel('orders-cuisine')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function advance(code: string, status: OrderStatus) {
    show(`${code} → ${trackLabelToast[status]}`)
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('code', code)
  }

  return (
    <main className={styles.main}>
      <StaffNav />
      <div className={styles.wrap}>
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

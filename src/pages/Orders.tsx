import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { authReady, supabase } from '../lib/supabase'
import { useReadyOrders } from '../hooks/useReadyOrders'
import logo from '../assets/logo.svg'
import './Orders.scss'

type OrderStatus = 'attente' | 'preparation' | 'pret_cuisine' | 'disponible' | 'recuperee'

interface Order {
  code: string
  status: OrderStatus
  created_at: string
}

const sections: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: 'attente', label: 'COMMANDES EN ATTENTE', statuses: ['attente'] },
  { key: 'en-cours', label: 'COMMANDES EN COURS', statuses: ['preparation', 'pret_cuisine'] },
  { key: 'comptoir', label: 'DISPONIBLES AU COMPTOIR', statuses: ['disponible'] },
]

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const readyCode = useReadyOrders({ announce: false })

  useEffect(() => {
    let alive = true
    let channel: ReturnType<typeof supabase.channel> | null = null

    const load = async () => {
      const { data } = await supabase
        .from('orders')
        .select('code, status, created_at')
        .neq('status', 'recuperee')
      if (alive && data) setOrders(data as Order[])
    }

    load()

    authReady.then(() => {
      if (!alive) return
      load()
      channel = supabase
        .channel('orders-board')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
        .subscribe()
    })

    const fallback = setInterval(load, 15000)

    return () => {
      alive = false
      clearInterval(fallback)
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="ord">
      <header className={`ord__header${readyCode ? ' ord__header--ready' : ''}`}>
        <AnimatePresence mode="wait">
          {readyCode ? (
            <motion.div
              key={readyCode}
              className="ord__ready"
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <span className="ord__ready-label">Commande prête</span>
              <span className="ord__ready-code">{readyCode}</span>
            </motion.div>
          ) : (
            <motion.img
              key="logo"
              className="ord__brand"
              src={logo}
              alt="Baraka Food"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
      </header>

      <div className="ord__body">
      {sections.map(section => {
        const list = orders
          .filter(o => section.statuses.includes(o.status))
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

        return (
          <section
            key={section.key}
            className="ord__row"
          >
            <div className="ord__row-head">
              <span className="ord__label">{section.label}</span>
              <span className="ord__count">{list.length}</span>
            </div>
            <div className="ord__codes">
              <AnimatePresence mode="popLayout">
                {list.map(order => (
                  <motion.div
                    key={order.code}
                    className="ord__code"
                    layout
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.35 }}
                  >
                    {order.code}
                  </motion.div>
                ))}
              </AnimatePresence>
              {list.length === 0 && orders.length === 0 && <span className="ord__empty">—</span>}
            </div>
          </section>
        )
      })}
      </div>
    </div>
  )
}

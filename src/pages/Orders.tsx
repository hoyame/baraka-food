import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { watchTable } from '../lib/realtime'
import type { LinkStatus } from '../lib/realtime'
import { useReadyOrders } from '../hooks/useReadyOrders'
import LinkIndicator from '../components/LinkIndicator'
import logo from '../assets/logo.svg'
import './Orders.scss'
import { useTitle } from '../hooks/useTitle'

type OrderStatus = 'attente' | 'preparation' | 'pret_cuisine' | 'disponible' | 'recuperee'

interface Order {
  code: string
  status: OrderStatus
  created_at: string
}

const sections: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: 'attente', label: 'COMMANDES EN ATTENTE DE PRÉPARATION', statuses: ['attente'] },
  { key: 'en-cours', label: 'COMMANDES EN COURS DE PRÉPARATION', statuses: ['preparation', 'pret_cuisine'] },
  { key: 'comptoir', label: 'DISPONIBLES AU COMPTOIR', statuses: ['disponible'] },
]

export default function Orders() {
  useTitle('Suivi des commandes')
  const [orders, setOrders] = useState<Order[]>([])
  const readyCode = useReadyOrders({ announce: false })
  const [link, setLink] = useState<LinkStatus>('reconnecting')

  useEffect(() => {
    let alive = true

    const load = async () => {
      const { data } = await supabase
        .from('orders')
        .select('code, status, created_at')
        .neq('status', 'recuperee')
      if (alive && data) setOrders(data as Order[])
    }

    load()
    const stop = watchTable('orders-board', 'orders', load, { onStatus: setLink })

    return () => {
      alive = false
      stop()
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

        <LinkIndicator status={link} />
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
                    initial={{ opacity: 0, scale: 0.55, y: -18, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.75, y: 14, filter: 'blur(4px)' }}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 26,
                      mass: 0.7,
                      filter: { duration: 0.25 },
                    }}
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

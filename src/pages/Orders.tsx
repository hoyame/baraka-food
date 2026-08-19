import { Fragment, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { watchTable } from '../lib/realtime'
import type { LinkStatus } from '../lib/realtime'
import type { Horaire, MenuData } from '../lib/api'
import { useMenu } from '../hooks/useMenu'
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

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function plagesDe(creneaux: string): { debut: number; fin: number }[] {
  return [...(creneaux || '').matchAll(/(\d{1,2})\s*[h:]\s*(\d{2})?\s*[-–]\s*(\d{1,2})\s*[h:]\s*(\d{2})?/gi)]
    .map(m => ({
      debut: parseInt(m[1], 10) * 60 + parseInt(m[2] || '0', 10),
      fin: parseInt(m[3], 10) * 60 + parseInt(m[4] || '0', 10),
    }))
}

function estOuvert(horaires: Horaire[], date: Date): boolean {
  const jour = JOURS[date.getDay()]
  const h = horaires.find(x => x.jour.toLowerCase() === jour.toLowerCase())
  if (!h || h.ferme) return false
  const minutes = date.getHours() * 60 + date.getMinutes()
  return plagesDe(h.creneaux).some(p => minutes >= p.debut && minutes < p.fin)
}

function fmtHeure(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h${m ? String(m).padStart(2, '0') : ''}`
}

function prochaineOuverture(horaires: Horaire[], date: Date): Date | null {
  for (let i = 0; i < 8; i++) {
    const jour = new Date(date.getFullYear(), date.getMonth(), date.getDate() + i)
    const h = horaires.find(x => x.jour.toLowerCase() === JOURS[jour.getDay()].toLowerCase())
    if (!h || h.ferme) continue
    for (const p of plagesDe(h.creneaux).sort((a, b) => a.debut - b.debut)) {
      const debut = new Date(jour.getFullYear(), jour.getMonth(), jour.getDate(), 0, p.debut)
      if (debut.getTime() > date.getTime()) return debut
    }
  }
  return null
}

function resumeHoraires(horaires: Horaire[]) {
  const bas = (j: string) => j.toLowerCase()
  const creneauxDe = (h: Horaire) =>
    plagesDe(h.creneaux).map(p => `${fmtHeure(p.debut)} – ${fmtHeure(p.fin)}`).join(' · ')

  const ouverts = horaires.filter(h => !h.ferme)
  if (!ouverts.length) return { principal: '', jours: '', exceptions: [] as string[] }

  const compte = new Map<string, number>()
  for (const h of ouverts) compte.set(creneauxDe(h), (compte.get(creneauxDe(h)) ?? 0) + 1)
  const principal = [...compte.entries()].sort((a, b) => b[1] - a[1])[0][0]

  const jours =
    ouverts.length === horaires.length
      ? '7j/7'
      : ouverts.length === 1
        ? `le ${bas(ouverts[0].jour)}`
        : `du ${bas(ouverts[0].jour)} au ${bas(ouverts[ouverts.length - 1].jour)}`

  const exceptions: string[] = []
  const fermes = horaires.filter(h => h.ferme)
  if (fermes.length) exceptions.push(`Fermé le ${fermes.map(h => bas(h.jour)).join(' et le ')}`)
  for (const h of ouverts) {
    if (creneauxDe(h) !== principal) exceptions.push(`Le ${bas(h.jour)} : ${creneauxDe(h)} uniquement`)
  }

  return { principal, jours, exceptions }
}

function toutEpuise(menu: MenuData): boolean {
  const flags: boolean[] = [
    ...menu.page1.burgers.map(x => x.available !== false),
    ...menu.page1.texmex.map(x => x.available !== false),
    ...menu.page2.frites.map(x => x.available !== false),
    ...menu.page2.desserts.map(x => x.available !== false),
    ...menu.page2.boissons.map(x => x.available !== false),
    ...menu.page3.tailles.map(x => x.available !== false),
    ...menu.page3.viandes.map(x => x.available !== false),
    ...menu.page3.extras.items.map(x => x.available !== false),
    menu.page2.menuKids.available !== false,
    menu.page2.sandwich?.available !== false,
  ]
  return flags.length > 0 && flags.every(dispo => !dispo)
}

export default function Orders() {
  useTitle('Suivi des commandes')
  const [orders, setOrders] = useState<Order[]>([])
  const readyCode = useReadyOrders({ announce: false })
  const [link, setLink] = useState<LinkStatus>('reconnecting')
  const { menu } = useMenu()
  const [params] = useSearchParams()
  const force = params.has('force')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let alive = true

    const load = async () => {
      const { data } = await supabase
        .from('orders')
        .select('code, status, created_at')
        .neq('status', 'recuperee')
      if (alive && data) setOrders((data as Order[]).filter(o => !/^(LV|LIV)-/i.test(o.code)))
    }

    load()
    const stop = watchTable('orders-board', 'orders', load, { onStatus: setLink })

    return () => {
      alive = false
      stop()
    }
  }, [])

  const horaires = menu?.infos.horaires ?? []
  const ferme = !force && horaires.length > 0 && !estOuvert(horaires, now)
  const rupture = params.has('rupture') || (!ferme && menu !== null && toutEpuise(menu))

  if (rupture) {
    return (
      <div className="ord ord--closed">
        <motion.img
          className="ord__closed-brand"
          src={logo}
          alt="Baraka Food"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        />
        <motion.p
          className="ord__closed-title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          STOCK ÉPUISÉ
        </motion.p>
        <motion.div
          className="ord__rupture"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p>Nos stocks sont épuisés pour aujourd'hui et la prise de commande est désormais impossible.</p>
          <p className="ord__rupture-excuse">Désolé de la gêne occasionnée — merci de votre compréhension.</p>
        </motion.div>
      </div>
    )
  }

  if (ferme) {
    const { principal, jours, exceptions } = resumeHoraires(horaires)
    const ouverture = prochaineOuverture(horaires, now)
    const diff = ouverture ? Math.max(0, ouverture.getTime() - now.getTime()) : 0
    const joursRestants = Math.floor(diff / 86400000)
    const blocs = [
      ...(joursRestants > 0
        ? [{ value: String(joursRestants), label: joursRestants > 1 ? 'JOURS' : 'JOUR' }]
        : []),
      { value: String(Math.floor(diff / 3600000) % 24).padStart(2, '0'), label: 'HEURES' },
      { value: String(Math.floor(diff / 60000) % 60).padStart(2, '0'), label: 'MINUTES' },
      { value: String(Math.floor(diff / 1000) % 60).padStart(2, '0'), label: 'SECONDES' },
    ]

    return (
      <div className="ord ord--closed">
        <motion.img
          className="ord__closed-brand"
          src={logo}
          alt="Baraka Food"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        />

        {ouverture && (
          <>
            <motion.p
              className="ord__closed-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              OUVERTURE DANS
            </motion.p>
            <motion.div
              className="ord__closed-timer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {blocs.map((b, i) => (
                <Fragment key={b.label}>
                  {i > 0 && <span className="ord__closed-sep">:</span>}
                  <span className="ord__closed-unit">
                    <span className="ord__closed-value">{b.value}</span>
                    <span className="ord__closed-unit-label">{b.label}</span>
                  </span>
                </Fragment>
              ))}
            </motion.div>
          </>
        )}

        <motion.div
          className="ord__closed-hours"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <span className="ord__closed-days">Ouvert {jours}</span>
          <span className="ord__closed-slots">{principal}</span>
          {exceptions.map(e => (
            <span key={e} className="ord__closed-exception">{e}</span>
          ))}
        </motion.div>
      </div>
    )
  }

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

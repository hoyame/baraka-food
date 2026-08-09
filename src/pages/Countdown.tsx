import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import logo from '../assets/logo.svg'
import './Countdown.scss'
import { useTitle } from '../hooks/useTitle'

const TARGET = new Date(2026, 7, 18, 0, 0, 0).getTime()

function parts(diff: number) {
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  }
}

export default function Countdown() {
  useTitle('Ouverture')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = Math.max(0, TARGET - now)
  const { days, hours, minutes, seconds } = parts(diff)
  const opened = diff === 0

  const blocks: { value: string; label: string }[] = [
    { value: String(days), label: days > 1 ? 'JOURS' : 'JOUR' },
    { value: String(hours).padStart(2, '0'), label: 'HEURES' },
    { value: String(minutes).padStart(2, '0'), label: 'MINUTES' },
    { value: String(seconds).padStart(2, '0'), label: 'SECONDES' },
  ]

  return (
    <div className="cd">
      <motion.img
        className="cd__brand"
        src={logo}
        alt="Baraka Food"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      />

      <motion.p
        className="cd__label"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        OUVERTURE LE
        <span className="cd__label-date">18/08/2026</span>
      </motion.p>

      {opened ? (
        <motion.p
          className="cd__open"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          C'EST OUVERT
        </motion.p>
      ) : (
        <motion.div
          className="cd__timer"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          {blocks.map((b, i) => (
            <Fragment key={b.label}>
              {i > 0 && <span className="cd__sep">:</span>}
              <div className="cd__unit">
                <span className="cd__value">{b.value}</span>
                <span className="cd__unit-label">{b.label}</span>
              </div>
            </Fragment>
          ))}
        </motion.div>
      )}
    </div>
  )
}

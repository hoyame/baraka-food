import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import logo from '../assets/logo.svg'
import '../pages/Countdown.scss'

interface Props {
  title: string
  dateLabel: string
  target: number
  openedText: string
}

function parts(diff: number) {
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  }
}

export default function CountdownScreen({ title, dateLabel, target, openedText }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = Math.max(0, target - now)
  const { days, hours, minutes, seconds } = parts(diff)
  const reached = diff === 0

  const blocks: { value: string; label: string }[] = [
    ...(days > 0 ? [{ value: String(days), label: days > 1 ? 'JOURS' : 'JOUR' }] : []),
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
        {title}
        <span className="cd__label-date">{dateLabel}</span>
      </motion.p>

      {reached ? (
        <motion.p
          className="cd__open"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {openedText}
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
